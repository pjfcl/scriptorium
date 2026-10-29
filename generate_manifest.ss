;; Script Chez Scheme Definitivo para Geração Automática do manifest.json
(import (chezscheme))

(define (generate-manifest)
  (printf "A gerar o manifest.json soberano via Chez Scheme...~n")
  (let ((md-dir "md")
        (entries '()))
    (when (file-directory? md-dir)
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
                                   (string-suffix? ".md" file-str)
                                   (not (string-contains? file-str "teste")))
                          (let* ((slug (string-replace-ext file-str ".md" ""))
                                 (path (string-append "/" cat-path "/" file-str)))
                            (set! entries
                              (cons `((path . ,path)
                                      (section . ,cat-str)
                                      (slug . ,slug))
                                    entries))
                            (printf "Artigo detetado para manifesto: [~a] ~a~n" cat-str slug))))))
                    files)))))
          cats)))

    ;; Escrever o manifest.json formatado
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
    (printf "manifest.json gerado com sucesso!~n")))

(define (string-suffix? suffix str)
  (let ((slen (string-length suffix))
        (len (string-length str)))
    (and (>= len slen)
         (string=? suffix (substring str (- len slen) len)))))

(define (string-contains? str sub)
  (let ((slen (string-length str))
        (sublen (string-length sub)))
    (let loop ((i 0))
      (cond
        ((> (+ i sublen) slen) #f)
        ((string=? (substring str i (+ i sublen)) sub) #t)
        (else (loop (+ i 1)))))))

(define (string-replace-ext str old new)
  (let ((len (string-length str)))
    (string-append (substring str 0 (- len (string-length old))) new)))

(guard (con [else (begin (display "Erro fatal no gerador de manifesto:\n") (print-condition con) (exit 255))])
  (generate-manifest))
