;; Script Chez Scheme Blindado para Geração Automática do manifest.json
;; Scriptorium Digital — paulolopes.org
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
              ;; Processa APENAS se for um diretório válido (corpus, escola, oficina, sobre)
              (when (file-directory? item-path)
                (let ((sub-files (directory-list item-path)))
                  (for-each
                    (lambda (sub-file)
                      (let* ((sub-file-str (if (symbol? sub-file) (symbol->string sub-file) sub-file))
                             (filepath (string-append item-path "/" sub-file-str)))
                        (when (and (file-regular? filepath)
                                   (string-suffix? ".md" sub-file-str)
                                   (not (string-contains? sub-file-str "teste")))
                          (let* ((slug (string-replace-ext sub-file-str ".md" ""))
                                 (path (string-append "/" item-str "/" sub-file-str)))
                            (set! entries
                              (cons `((path . ,path)
                                      (section . ,item-str)
                                      (slug . ,slug))
                                    entries))
                            (printf "Registo adicionado ao manifesto: [secção: ~a] [slug: ~a]\n" item-str slug))))))
                    sub-files)))))
          root-items)))

    ;; Escrever o ficheiro manifest.json formatado com rigor JSON
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
    (printf "manifest.json gerado com sucesso absoluto no ecossistema!\n")))

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
