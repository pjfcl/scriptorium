;; Script Chez Scheme Avançado para o Scriptorium (Extração de Frontmatter YAML)
(import (chezscheme))

(define (safe-read-file filepath)
  (guard (con [else #f])
    (call-with-input-file filepath
      (lambda (p) (get-string-all p)))))

;; Função para extrair o título real do frontmatter YAML (ex: title: "...")
(define (extract-title content fallback-name)
  (let ((lines (let loop ((s content) (acc '()))
                 (cond
                   ((string=? s "") (reverse acc))
                   ((string-index s #\newline) =>
                    (lambda (i)
                      (loop (substring s (+ i 1) (string-length s))
                            (cons (substring s 0 i) acc))))
                   (else (reverse (cons s acc)))))))
    (let find-title ((lst lines))
      (cond
        ((null? lst) fallback-name)
        ((and (> (string-length (car lst)) 7)
              (string=? (substring (car lst) 0 6) "title:"))
         ;; Limpar as aspas do título se existirem
         (let* ((raw (substring (car lst) 6 (string-length (car lst))))
                (trimmed (string-trim raw)))
           (if (and (> (string-length trimmed) 1)
                    (char=? (string-ref trimmed 0) #\"))
               (substring trimmed 1 (- (string-length trimmed) 1))
               trimmed)))
        (else (find-title (cdr lst)))))))

(define (string-trim str)
  (let ((len (string-length str)))
    (let skip-left ((i 0))
      (if (>= i len) ""
          (if (char-whitespace? (string-ref str i))
              (skip-left (+ i 1))
              (let skip-right ((j (- len 1)))
                (if (< j i) ""
                    (if (char-whitespace? (string-ref str j))
                        (skip-right (- j 1))
                        (substring str i (+ j 1))))))))))

(define (generate-search-index)
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
                         ;; Ignorar ficheiros de teste e garantir que são .md
                         (when (and (file-regular? filepath)
                                    (string-suffix? ".md" file-str)
                                    (not (string-prefix? "teste" file-str)))
                           (let* ((content (safe-read-file filepath))
                                  (clean-content (if content content ""))
                                  (real-title (extract-title clean-content file-str))
                                  (url (string-append "/" cat-str "/" (string-replace-ext file-str ".md" ".html")))
                                  (snippet (substring clean-content 0 (min 250 (string-length clean-content)))))
                             (set! index-entries
                               (cons `((title . ,real-title)
                                       (category . ,cat-str)
                                       (url . ,url)
                                       (content . ,snippet))
                                     index-entries))
                             (printf "Indexado: ~a (~a)~n" real-title file-str)))))
                     files)))))
           cats)))
      (else
       (printf "Aviso: Diretório 'md' não encontrado!~n")))

    (printf "Total de ensaios válidos indexados: ~a~n" (length index-entries))

    ;; Escrever o ficheiro search-index.json limpo
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
      'replace)
    (printf "search-index.json atualizado com sucesso e títulos extraídos.~n")))

(define (string-suffix? suffix str)
  (let ((slen (string-length suffix))
        (len (string-length str)))
    (and (>= len slen)
         (string=? suffix (substring str (- len slen) len)))))

(define (string-prefix? prefix str)
  (let ((plen (string-length prefix))
        (len (string-length str)))
    (and (>= len plen)
         (string=? prefix (substring str 0 plen)))))

(define (string-replace-ext str old-ext new-ext)
  (let ((len (string-length str)))
    (string-append (substring str 0 (- len (string-length old-ext))) new-ext)))

;; Execução protegida
(guard (con [else (begin (display "Erro na execução do script Scheme:\n") (print-condition con) (exit 255))])
  (generate-search-index))
