;; Script Chez Scheme com Diagnóstico e Tratamento de Erros para o Scriptorium
(import (chezscheme))

;; Leitura segura de linhas de um ficheiro
(define (read-lines filepath)
  (guard (con [else '()])
    (call-with-input-file filepath
      (lambda (p)
        (let loop ((line (get-line p)) (acc '()))
          (if (eof-object? line)
              (reverse acc)
              (loop (get-line p) (cons line acc))))))))

;; Extração ultra-segura do título (evita erros de índice em linhas curtas)
(define (extract-title lines fallback)
  (let loop ((lst lines))
    (cond
      ((null? lst) fallback)
      ((and (string? (car lst))
            (>= (string-length (car lst)) 2)
            (string=? (substring (car lst) 0 2) "# "))
       (substring (car lst) 2 (string-length (car lst))))
      (else (loop (cdr lst))))))

(define (generate-index)
  (printf "A iniciar a varredura das pastas Markdown...~n")
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
                           (guard (err [else (printf "Aviso ao processar o ficheiro ~a: erro ignorado~n" filepath)])
                             (let* ((lines (read-lines filepath))
                                    (title (extract-title lines file-str))
                                    (url (string-append "/" cat-str "/" (string-replace-ext file-str ".md" ".html"))))
                               (set! entries
                                 (cons `((title . ,title)
                                         (category . ,cat-str)
                                         (url . ,url)
                                         (content . "Conteúdo indexado do Scriptorium"))
                                       entries))
                               (printf "Indexado: ~a (~a)~n" title file-str))))))
                     files)))))
           cats)))
      (else
       (printf "Aviso: Diretório 'md' não encontrado!~n")))

    (printf "Total de artigos indexados com sucesso: ~a~n" (length entries))

    ;; Escrever o search-index.json
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
    (printf "search-index.json gerado com sucesso soberano.~n")))

(define (string-suffix? suffix str)
  (let ((slen (string-length suffix))
        (len (string-length str)))
    (and (>= len slen)
         (string=? suffix (substring str (- len slen) len)))))

(define (string-replace-ext str old new)
  (let ((len (string-length str)))
    (string-append (substring str 0 (- len (string-length old))) new)))

;; Bloco principal protegido que imprime o erro exato se algo falhar
(guard (con [else (begin
                    (display "========================================\n")
                    (display "ERRO FATAL DETETADO NO SCRIPT SCHEME:\n")
                    (display-condition con)
                    (display "\n========================================\n")
                    (exit 1))])
  (generate-index))
