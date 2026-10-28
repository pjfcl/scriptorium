;; Script Chez Scheme Final e Imaculado para o Scriptorium
(import (chezscheme))

(define (read-file-string filepath)
  (guard (con [else ""])
    (call-with-input-file filepath
      (lambda (p) (get-string-all p)))))

(define (read-lines filepath)
  (guard (con [else '()])
    (call-with-input-file filepath
      (lambda (p)
        (let loop ((line (get-line p)) (acc '()))
          (if (eof-object? line)
              (reverse acc)
              (loop (get-line p) (cons line acc))))))))

(define (extract-title lines fallback)
  (let loop ((lst lines))
    (cond
      ((null? lst) fallback)
      ((and (string? (car lst))
            (>= (string-length (car lst)) 2)
            (string=? (substring (car lst) 0 2) "# "))
       (substring (car lst) 2 (string-length (car lst))))
      (else (loop (cdr lst))))))

;; Sanitiza e limpa para formato JSON seguro
(define (sanitize-content raw-str)
  (let* ((max-len (min 400 (string-length raw-str)))
         (sub (substring raw-str 0 max-len))
         (out (let loop ((i 0) (acc '()))
                (if (= i (string-length sub))
                    (list->string (reverse acc))
                    (let ((c (string-ref sub i)))
                      (cond
                        ((char=? c #\newline) (loop (+ i 1) (cons #\space acc)))
                        ((char=? c #\return) (loop (+ i 1) acc))
                        ((char=? c #\") (loop (+ i 1) (cons #\' acc)))
                        (else (loop (+ i 1) (cons c acc)))))))))
    out))

(define (generate-index)
  (printf "A gerar índice de pesquisa soberano...~n")
  (let ((md-dir "md")
        (entries '()))
    (cond
      ((file-directory? md-dir)
       (let ((cats (directory-list md-dir)))
         (for-each
           (lambda (cat)
             (let* ((cat-str (if (symbol? cat) (symbol->string cat) cat))
                    (cat-path (string-append md-dir "/" cat-str)))
               (when (file-directory? cat-path)
                 (let ((files (directory-list cat-path)))
                   (for-each
                     (lambda (file)
                       (let* ((file-str (if (symbol? file) (symbol->string file) file))
                              (filepath (string-append cat-path "/" file-str)))
                         ;; FILTRO CRUCIAL: Ignorar ficheiros de teste e garantir que são .md
                         (when (and (file-regular? filepath)
                                    (string-suffix? ".md" file-str)
                                    (not (string-prefix? "teste" file-str)))
                           (guard (err [else (printf "Aviso ao processar ~a~n" filepath)])
                             (let* ((lines (read-lines filepath))
                                    (raw-content (read-file-string filepath))
                                    (title (extract-title lines file-str))
                                    (url (string-append "/" cat-str "/" (string-replace-ext file-str ".md" ".html")))
                                    (clean-snippet (sanitize-content raw-content)))
                               (set! entries
                                 (cons `((title . ,title)
                                         (category . ,cat-str)
                                         (url . ,url)
                                         (content . ,clean-snippet))
                                       entries))
                               (printf "Indexado com sucesso: ~a~n" title))))))
                     files)))))
           cats)))
      (else
       (printf "Diretório 'md' não encontrado.~n")))

    (printf "Total de ensaios válidos indexados: ~a~n" (length entries))

    ;; Escrever o search-index.json limpo
    (call-with-output-file "search-index.json"
      (lambda (p)
        (fprintf p "[\n")
        (let loop ((lst entries) (first? #t))
          (unless (null? lst)
            (let ((entry (car lst)))
              (unless first? (fprintf p ",\n"))
              (fprintf p "  {\n    \"title\": ~s,\n    \"category\": ~s,\n    \"url\": ~s,\n    \"content\": ~s\n  }"
                       (cdr (assoc 'title entry))
                       (cdr (assoc 'category entry))
                       (cdr (assoc 'url entry))
                       (cdr (assoc 'content entry))))
            (loop (cdr lst) #f)))
        (fprintf p "\n]\n"))
      'replace)
    (printf "search-index.json atualizado com exclusão de testes.~n")))

(define (string-suffix? suffix str)
  (let ((slen (string-length suffix))
        (len (string-length str)))
    (and (>= len slen)
         (string=? suffix (substring str (- len slen) len)))))

(define (string-prefix? prefix str)
  (let ((plen (string-length prefix))
        (len (string-length str)))
    (and (>= len plen)
         (string=? prefix (substring str 0 plen)))))

(define (string-replace-ext str old new)
  (let ((len (string-length str)))
    (string-append (substring str 0 (- len (string-length old))) new)))

(guard (con [else (begin (display "Erro fatal:\n") (print-condition con) (exit 255))])
  (generate-index))
