;; Script Chez Scheme Robusto para o Scriptorium
(import (chezscheme))

(define (safe-read-file filepath)
  (guard (con [else #f])
    (call-with-input-file filepath
      (lambda (p) (get-string-all p)))))

(define (generate-search-index)
  (printf "Iniciando a geração do índice de pesquisa...~n")
  (let ((md-dir "md")
        (index-entries '()))
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
                           (let* ((content (safe-read-file filepath))
                                  (clean-content (if content content "")))
                             (let* ((url (string-append "/" cat-str "/" (string-replace-ext file-str ".md" ".html")))
                                    (snippet (substring clean-content 0 (min 200 (string-length clean-content)))))
                               (set! index-entries
                                 (cons `((title . ,file-str)
                                         (category . ,cat-str)
                                         (url . ,url)
                                         (content . ,snippet))
                                       index-entries))
                             (printf "Processado: ~a/~a~n" cat-str file-str))))))
                     files)))))
           cats)))
      (else
       (printf "Aviso: Diretório 'md' não encontrado na raiz!~n")))

    (printf "Total de ensaios indexados: ~a~n" (length index-entries))

    ;; Escrever o ficheiro search-index.json de forma segura
    (guard (con [else (begin (display "Erro ao escrever o ficheiro JSON\n") (exit 1))])
      (call-with-output-file "search-index.json"
        (lambda (p)
          (fprintf p "[\n")
          (let loop ((entries index-entries) (first? #t))
            (unless (null? entries)
              (let ((entry (car entries)))
                (unless first? (fprintf p ",\n"))
                (fprintf p "  {\n    \"title\": ~s,\n    \"category\": ~s,\n    \"url\": ~s,\n    \"content\": ~s\n  }"
                         (cdr (assoc 'title entry))
                         (cdr (assoc 'category entry))
                         (cdr (assoc 'url entry))
                         (cdr (assoc 'content entry))))
              (loop (cdr entries) #f)))
          (fprintf p "\n]\n"))
        'replace))
    (printf "search-index.json gerado com sucesso soberano.~n")))

(define (string-suffix? suffix str)
  (let ((slen (string-length suffix))
        (len (string-length str)))
    (and (>= len slen)
         (string=? suffix (substring str (- len slen) len)))))

(define (string-replace-ext str old-ext new-ext)
  (let ((len (string-length str)))
    (string-append (substring str 0 (- len (string-length old-ext))) new-ext)))

;; Execução protegida
(guard (con [else (begin (display "Erro fatal na execução do script Scheme:\n") (print-condition con) (exit 255))])
  (generate-search-index))
