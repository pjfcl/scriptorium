;; Script Chez Scheme Definitivo e Robusto para o Scriptorium
(import (chezscheme))

;; Leitura segura de linhas de um ficheiro em Scheme puro
(define (read-lines filepath)
  (guard (con [else '()])
    (call-with-input-file filepath
      (lambda (p)
        (let loop ((line (get-line p)) (acc '()))
          (if (eof-object? line)
              (reverse acc)
              (loop (get-line p) (cons line acc))))))))

;; Extração segura do título a partir da primeira linha com H1 (# )
(define (extract-title lines fallback)
  (let loop ((lst lines))
    (cond
      ((null? lst) fallback)
      ((and (> (string-length (car lst)) 2)
            (string=? (substring (car lst) 0 2) "# "))
       (let ((title-str (substring (car lst) 2 (string-length (car lst)))))
         title-str))
      (else (loop (cdr lst))))))

(define (generate-index)
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
                           (let* ((lines (read-lines filepath))
                                  (title (extract-title lines file-str))
                                  (url (string-append "/" cat-str "/" (string-replace-ext file-str ".md" ".html"))))
                             (set! entries
                               (cons `((title . ,title)
                                       (category . ,cat-str)
                                       (url . ,url)
                                       (content . "Conteúdo indexado do Scriptorium"))
                                     entries))
                             (printf "Indexado com sucesso: ~a (~a)~n" title file-str))))))
                     files)))))
           cats)))
      (else
       (printf "Aviso: Diretório 'md' não encontrado!~n")))

    (printf "Total de artigos indexados: ~a~n" (length entries))

    ;; Escrever o search-index.json formatado de forma limpa
    (guard (con [else (begin (display "Erro ao escrever o search-index.json\n") (exit 1))])
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
        'replace))
    (printf "search-index.json gerado com sucesso soberano.~n")))

(define (string-suffix? suffix str)
  (let ((slen (string-length suffix))
        (len (string-length str)))
    (and (>= len slen)
         (string=? suffix (substring str (- len slen) len)))))

(define (string-replace-ext str old new)
  (let ((len (string-length str)))
    (string-append (substring str 0 (- len (string-length old))) new)))

;; Execução protegida com tratamento de exceções
(guard (con [else (begin (display "Erro fatal no script Scheme:\n") (print-condition con) (exit 255))])
  (generate-index))
