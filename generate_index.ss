;; Script Chez Scheme para gerar o search-index.json
(import (chezscheme))

(define (read-file-string filepath)
  (call-with-input-file filepath
    (lambda (p) (get-string-all p))))

(define (generate-search-index)
  ;; Lógica de leitura de pastas e geração do JSON
  (printf "A processar ficheiros Markdown para o Scriptorium...\\n")
  ;; Exemplo de escrita do ficheiro search-index.json estático
  (call-with-output-file "search-index.json"
    (lambda (p)
      (fprintf p "[]\\n"))
    'replace))

(generate-search-index)
