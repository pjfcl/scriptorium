;; Script Chez Scheme corrigido e robusto para o Scriptorium
(import (chezscheme))

(define (read-file-string filepath)
  (call-with-input-file filepath
    (lambda (p) (get-string-all p))))

(define (generate-search-index)
  (let ((md-dir "md")
        (index-entries '()))
    (if (file-directory? md-dir)
        (let loop-cats ((cats (directory-list md-dir)))
          (unless (null? cats)
            (let* ((cat (car cats))
                   (cat-path (string-append md-dir "/" (keyword->string cat) ))) ; ou string direto
              ;; Nota: em Chez Scheme, directory-list devolve strings se forem nomes
              (let* ((cat-str (if (symbol? cat) (symbol->string cat) cat))
                     (real-path (string-append md-dir "/" cat-str)))
                (when (file-directory? real-path)
                  (let loop-files ((files (directory-list real-path)))
                    (unless (null? files)
                      (let* ((file (car files))
                             (file-str (if (symbol? file) (symbol->string file) file))
                             (filepath (string-append real-path "/" file-str)))
                        (when (and (file-regular? filepath)
                                   (string-suffix? ".md" file-str))
                          (let* ((content (read-file-string filepath))
                                 (url (string-append "/" cat-str "/" (string-replace-ext file-str ".md" ".html"))))
                            (set! index-entries
                              (cons `((title . ,file-str)
                                      (category . ,cat-str)
                                      (url . ,url)
                                      (content . ,(substring content 0 (min 200 (string-length content)))))
                                    index-entries)))))
                        (loop-files (cdr files))))))
              (loop-cats (cdr cats)))))
        (printf "Aviso: Diretório 'md' não encontrado!\\n"))
    
    (printf "Total de entradas encontradas: ~a\\n" (length index-entries))

    ;; Escrever o ficheiro search-index.json preenchido
    (call-with-output-file "search-index.json"
      (lambda (p)
        (fprintf p "[\\n")
        (let loop ((entries index-entries) (first? #t))
          (unless (null? entries)
            (let ((entry (car entries)))
              (unless first? (fprintf p ",\\n"))
              (fprintf p "  {\\n    \"title\": ~s,\\n    \"category\": ~s,\\n    \"url\": ~s,\\n    \"content\": ~s\\n  }"
                       (cdr (assoc 'title entry))
                       (cdr (assoc 'category entry))
                       (cdr (assoc 'url entry))
                       (cdr (assoc 'content entry))))
            (loop (cdr entries) #f)))
        (fprintf p "\\n]\\n"))
      'replace)
    (printf "search-index.json gerado com sucesso.\\n")))

(define (string-suffix? suffix str)
  (let ((slen (string-length suffix))
        (len (string-length str)))
    (and (>= len slen)
         (string=? suffix (substring str (- len slen) len)))))

(define (string-replace-ext str old-ext new-ext)
  (let ((len (string-length str)))
    (string-append (substring str 0 (- len (string-length old-ext))) new-ext)))

(generate-search-index)
