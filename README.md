# scriptorium
Investigação de Humanidades: linguagem e teoria crítica. 

-----

# Scriptorium Digital — paulolopes.org

> *"Cozinhar é uma forma de pensar a matéria. Escrever é uma forma de cozinhar a ideia."*

---

## 1. O Projeto & Visão Geral

O **Scriptorium Digital** (`paulolopes.org`) constitui um arquivo de Humanidades, um laboratório de pensamento crítico e uma oficina de resistência hospedada de forma independente. Longe do fluxo acelerado, utilitário e efêmero das redes sociais, este espaço cultiva a reflexão aprofundada, a estética, a técnica e a soberania digital. 

O ecossistema digital global articula-se em três eixos fundamentais:
1. **Matéria & Fogo:** Culinária auto-etnográfica e permacultura.
2. **Palavra & Código:** Investigação cultural, ensaísmo e programação minimalista (`C`, *Chez Scheme*, `Assembly`).
3. **Eixo Holístico:** Yoga clássico, filosofia e arquivo de artefactos visuais (desenhos, registos fotográficos e design).

---

## 2. Arquitetura Técnica & Soberania Digital

Este repositório alberga a vertente estática e programática do Scriptorium (hospedada em GitHub Pages com domínio autónomo). A engenharia do portal assenta em pilares de simplicidade, leveza e independência de frameworks pesadas:

* **Arquitetura SPA Minimalista (`app.js`):** Um motor de interface de página única leve e sem dependências complexas, que interpreta diretamente ficheiros Markdown no cliente.
* **Automação em Chez Scheme (`.ss`):** Scripts nativos em Scheme que varrem a árvore de ficheiros Markdown para gerar autonomamente o manifesto de navegação (`manifest.json`) e o índice de pesquisa textual (`search-index.json`).
* **CI/CD com GitHub Actions (`update-index.yml`):** Um pipeline soberano que executa os scripts de compilação em Scheme e atualiza o repositório em cada novo *push* de ensaios, assegurando zero esforço manual na publicação.
* **Estilização Atemporal (`style.css` / W3.CSS):** Design focado na legibilidade tipográfica e no rigor formal das edições académicas e literárias.

---

## 3. Estrutura do Arquivo Markdown (`md/`)

O acervo textual do Scriptorium organiza-se de forma estrita em diretórios temáticos:

* **`/corpus`** — O núcleo de ensaios, leituras críticas e narrativas experimentais. Divide-se conceptualmente em:
  * *Sementes:* Fragmentos, notas rápidas e citações.
  * *Colheitas:* Ensaios desenvolvidos e reflexões aprofundadas.
  * *Tinturas:* Ficção, prosa e registos literários.
* **`/escola`** — Cadernos académicos de investigação, estudos culturais e auto-etnografia no âmbito da Universidade Aberta.
* **`/oficina`** — Humanidades Digitais, *Critical Code Studies*, reflexões sobre arquiteturas em *Chez Scheme* e engenharia de software livre.
* **`/sobre`** — Manifesto, Protocolo P.A.R.T.E. e nota bio-bibliográfica do artífice.

---

## 4. O Protocolo de Publicação e Controlo

O fluxo de publicação foi concebido para o trabalho em qualquer lugar, exigindo apenas a escrita de novos blocos em Markdown com o respetivo cabeçalho *Frontmatter* (título, data, categoria). O ecossistema encarrega-se de indexar, processar e servir o conhecimento com absoluta independência e rigor estético.

