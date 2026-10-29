;; Script Chez Scheme Rigoroso para generate_manifest.ss
;; Scriptorium Digital - paulolopes.org
(import (chezscheme))

(define (generate-manifest)
  (printf "A gerar o manifest.json em Chez Scheme...\n")
  (let ((md-dir "md")
        (entries '()))
    (when (file-directory? md-dir)
      (let ((root-items (directory-list md-dir)))
        (for-each
          (lambda (item)
            (let* ((item-str (if (symbol? item) (symbol->string item) item))
                   (item-path (string-append md-dir "/" item-str)))
              (when (file-directory? item-path)
                (let ((sub-files (directory-list item-path)))
                  (for-each
                    (lambda (sub-file)
                      (let* ((sub-file-str (if (symbol? sub-file) (symbol->string sub-file) sub-file))
                             (filepath (string-append item-path "/" sub-file-str)))
                        (when (file-regular? filepath)
                          (let ((len (string-length sub-file-str)))
                            (when (and (> len 3)
                                       (string=? (substring sub-file-str (- len 3) len) ".md"))
                              (let* ((slug (substring sub-file-str 0 (- len 3)))
                                     (path (string-append "/" item-str "/" sub-file-str)))
                                (unless (string=? slug "teste")
                                  (set! entries
                                    (cons (list
                                            (cons 'path path)
                                            (cons 'section item-str)
                                            (cons 'slug slug))
                                          entries))
                                  (printf "Artigo adicionado: ~a / ~a\n" item-str slug)))))))))
                    sub-files)))))
          root-items)))

    ;; Escrever manifest.json
    (call-with-output-file "manifest.json"
      (lambda (p)
        (fprintf p "{\n  \"artigos\": [\n")
        (let loop ((lst entries) (first? #t))
          (unless (null? lst)
            (let ((entry (car lst)))
              (unless first? (fprintf p ",\n"))
              (fprintf p "    {\n      \"path\": ~s,\n      \"section\": ~s,\n      \"slug\": ~s\n    }"
                       (cdr (assoc 'path entry))
                       (cdr (assoc 'section entry))
                       (cdr (assoc 'slug entry))))
            (loop (cdr lst) #f)))
        (fprintf p "\n  ]\n}\n"))
      'replace)
    (printf "manifest.json gerado com sucesso!\n")))

(define (safe-run)
  (guard (con [else (begin (display "Erro fatal no manifesto:\n") (print-condition con) (exit 255))])
    (generate-manifest)))

(safe-run)
