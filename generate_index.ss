;; Script Chez Scheme Definitivo para o Scriptorium (Com Conteúdo Real)
(import (chezscheme))

;; Leitura segura do ficheiro inteiro em string
(define (read-file-string filepath)
  (guard (con [else ""])
    (call-with-input-file filepath
      (lambda (p) (get-string-all p)))))

;; Leitura de linhas para extrair o título H1 (# )
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

;; Limpa o conteúdo para formato JSON seguro (remove quebras de linha excessivas e aspas perigosas)
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
  (printf "A iniciar a extração real de conteúdos para o Scriptorium...~n")
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
                         (when (and (file-regular? filepath)
                                    (string-suffix? ".md" file-str))
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
                               (printf "Indexado com conteúdo real: ~a (~a)~n" title file-str))))))
                     files)))))
           cats)))
      (else
       (printf "Aviso: Diretório 'md' não encontrado!~n")))

    (printf "Total de artigos com conteúdo indexado: ~a~n" (length entries))

    ;; Escrever o search-index.json formatado com os dados reais
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
    (printf "search-index.json gerado com sucesso soberano e conteúdo real incorporado.~n")))

(define (string-suffix? suffix str)
  (let ((slen (string-length suffix))
        (len (string-length str)))
    (and (>= len slen)
         (string=? suffix (substring str (- len slen) len)))))

(define (string-replace-ext str old new)
  (let ((len (string-length str)))
    (string-append (substring str 0 (- len (string-length old))) new)))

;; Execução protegida
(guard (con [else (begin (display "Erro fatal no script Scheme:\n") (print-condition con) (exit 255))])
  (generate-index))
