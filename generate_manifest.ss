;; Script Chez Scheme Definitivo e Robusto para gerar o manifest.json
;; Scriptorium Digital - paulolopes.org
(import (chezscheme))

(define (generate-manifest)
  (printf "A iniciar a geração soberana do manifest.json via Chez Scheme...\n")
  (let ((md-dir "md")
        (entries '()))
    (when (file-directory? md-dir)
      (let ((root-items (directory-list md-dir)))
        (for-each
          (lambda (item)
            (let* ((item-str (if (symbol? item) (symbol->string item) item))
                   (item-path (string-append md-dir "/" item-str)))
              (guard (ex [else #f])
                (when (file-directory? item-path)
                  (let ((sub-files (directory-list item-path)))
                    (for-each
                      (lambda (sub-file)
                        (let* ((sub-file-str (if (symbol? sub-file) (symbol->string sub-file) sub-file))
                               (filepath (string-append item-path "/" sub-file-str)))
                          (guard (ex2 [else #f])
                            (when (and (file-regular? filepath)
                                       (> (string-length sub-file-str) 3)
                                       (string=? (substring sub-file-str (- (string-length sub-file-str) 3) (string-length sub-file-str)) ".md"))
                              (let* ((slug (substring sub-file-str 0 (- (string-length sub-file-str) 3)))
                                     (path (string-append "/" item-str "/" sub-file-str)))
                                (unless (string=? slug "teste")
                                  (set! entries
                                    (cons `((path . ,path)
                                            (section . ,item-str)
                                            (slug . ,slug))
                                          entries))
                                  (printf "Artigo adicionado ao manifesto: [~a] ~a\n" item-str slug))))))))
                      sub-files))))))
          root-items)))

    ;; Escrever o ficheiro manifest.json formatado com rigor
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
    (printf "manifest.json gerado com sucesso soberano em Chez Scheme!\n")))

(define (guard-wrapper)
  (guard (con [else (begin (display "Aviso capturado pelo guard geral:\n") (print-condition con) (exit 0))])
    (generate-manifest)))

(guard-wrapper)
