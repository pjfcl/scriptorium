;; Script Chez Scheme Definitivo e Perfeito para generate_manifest.ss
;; Scriptorium Digital - paulolopes.org
(import (chezscheme))

(define (generate-manifest)
  (printf "A gerar o manifest.json em Chez Scheme...\n")
  (let ((entries '()))
    (if (file-directory? "md")
        (let ((cats (directory-list "md")))
          (for-each
            (lambda (cat)
              (let ((cat-str (if (symbol? cat) (symbol->string cat) cat)))
                (let ((cat-path (string-append "md/" cat-str)))
                  (if (file-directory? cat-path)
                      (let ((files (directory-list cat-path)))
                        (for-each
                          (lambda (file)
                            (let ((file-str (if (symbol? file) (symbol->string file) file)))
                              (let ((filepath (string-append cat-path "/" file-str)))
                                (if (file-regular? filepath)
                                    (let ((len (string-length file-str)))
                                      (if (and (> len 3)
                                               (string=? (substring file-str (- len 3) len) ".md"))
                                          (let ((slug (substring file-str 0 (- len 3)))
                                                (path (string-append "/" cat-path "/" file-str)))
                                            (if (not (string=? slug "teste"))
                                                (begin
                                                  (set! entries
                                                    (cons (list
                                                            (cons 'path path)
                                                            (cons 'section cat-str)
                                                            (cons 'slug slug))
                                                          entries))
                                                  (printf "Artigo adicionado: ~a / ~a\n" cat-str slug))
                                                #f))
                                          #f))
                                    #f))))
                          files))
                      #f))))
            cats))
        #f)

    ;; Escrever manifest.json
    (call-with-output-file "manifest.json"
      (lambda (p)
        (fprintf p "{\n  \"artigos\": [\n")
        (let loop ((lst entries) (first? #t))
          (if (null? lst)
              #f
              (let ((entry (car lst)))
                (if (not first?) (fprintf p ",\n") #f)
                (fprintf p "    {\n      \"path\": ~s,\n      \"section\": ~s,\n      \"slug\": ~s\n    }"
                         (cdr (assoc 'path entry))
                         (cdr (assoc 'section entry))
                         (cdr (assoc 'slug entry)))
                (loop (cdr lst) #f))))
        (fprintf p "\n  ]\n}\n"))
      'replace)
    (printf "manifest.json gerado com sucesso!\n")))

(define (safe-run)
  (guard (con [else (begin (display "Erro fatal no manifesto.\n") (exit 255))])
    (generate-manifest)))

(safe-run)
