/* ==========================================================================
   PAULOLOPES.ORG / SCRIPTORIUM DIGITAL — Motor Universal (app.js)
   Web Design, Soberania Digital & Arquitetura Estática
   Autor: Paulo Furtado Lopes (mail@paulolopes.org)
   ========================================================================== */

// 1. MANIFESTO GLOBAL DE FICHEIROS MARKDOWN
// Adiciona novos ficheiros respeitando a convenção: YYYYMMDD_slug.md
const manifest = [
    // CORPUS (Sementes, Colheitas, Tinturas)
    'corpus/md/20261022_nomada-europeu-de-esquerda.md',
    'corpus/md/20261017_arte-e-social.md',
    'corpus/md/20261016_alguns-problemas-das-redes-sociais.md',
    
    // ESCOLA (Cadernos UAb, Cultura Mediada, Teoria)
    'escola/md/20261010_caderno-uab-autoetnografia.md',
    
    // OFICINA (Critical Code Studies, Scheme, C/POSIX, Zettelkasten)
    'oficina/md/20261005_critical-code-studies.md'
];

/**
 * Deteta a profundidade da página atual na árvore de diretórios
 * @returns {string} Prefixo de caminho relativo ('./' ou '../')
 */
function getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/corpus/') || path.includes('/escola/') || path.includes('/oficina/') || path.includes('/sobre/')) {
        return '../';
    }
    return './';
}

/**
 * Parser de YAML Front Matter e Markdown
 * Separa os metadados contidos entre '---' do corpo do texto.
 * @param {string} text Conteúdo bruto do ficheiro .md
 * @returns {object} { meta: object, content: string }
 */
function parseMarkdown(text) {
    const regex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
    const match = text.match(regex);
    if (match) {
        try {
            return {
                meta: jsyaml.load(match[1]) || {},
                content: match[2]
            };
        } catch (e) {
            console.error("Erro ao processar metadados YAML:", e);
        }
    }
    return { meta: {}, content: text };
}

/* ==========================================================================
   2. MOTOR DA CAPA PRINCIPAL (index.html na Raiz)
   ========================================================================== */
async function carregarCapaPrincipal() {
    const container = document.getElementById('entradas-recentes');
    if (!container) return; // Só executa se encontrar a div na Capa

    const basePath = getBasePath();
    let artigos = [];

    // Fetch de todos os ficheiros registados no manifesto
    for (const relPath of manifest) {
        try {
            const res = await fetch(basePath + relPath);
            if (res.ok) {
                const rawText = await res.text();
                const parsed = parseMarkdown(rawText);
                artigos.push({
                    path: relPath,
                    slug: relPath.split('/').pop().replace('.md', ''),
                    section: relPath.split('/')[0],
                    meta: parsed.meta,
                    content: parsed.content
                });
            }
        } catch (e) {
            console.error("Erro ao carregar ficheiro para a capa:", relPath, e);
        }
    }

    if (artigos.length === 0) {
        container.innerHTML = '<p class="font-mono w3-small" style="color: var(--muted-color);">Nenhum ficheiro de nota encontrado no arquivo.</p>';
        return;
    }

    // Ordenação por data decrescente (mais recente primeiro)
    artigos.sort((a, b) => new Date(b.meta.date || 0) - new Date(a.meta.date || 0));

    // Seleção de apenas 1 artigo mais recente por categoria
    const categoriasVistas = new Set();
    const ultimosPorCategoria = [];

    for (const artigo of artigos) {
        const cat = (artigo.meta.category || artigo.section || 'geral').toLowerCase();
        if (!categoriasVistas.has(cat)) {
            categoriasVistas.add(cat);
            ultimosPorCategoria.push(artigo);
        }
    }

    // Geração dos cartões 100% clicáveis
    let htmlOutput = '';
    ultimosPorCategoria.forEach(artigo => {
        const targetUrl = `${artigo.section}/index.html?artigo=${artigo.slug}`;
        const catLabel = (artigo.meta.category || artigo.section).toUpperCase();
        
        htmlOutput += `
            <a href="${targetUrl}" class="entry-card-link">
                <div class="entry-card">
                    <span class="entry-meta">${catLabel} • ${artigo.meta.date || ''}</span>
                    <h3>${artigo.meta.title || 'Sem título'}</h3>
                    <p>${artigo.meta.summary || ''}</p>
                </div>
            </a>
        `;
    });

    container.innerHTML = htmlOutput;
}

/* ==========================================================================
   3. ROTEADOR DE SECÇÕES (Corpus, Escola, Oficina, Sobre)
   ========================================================================== */
async function roteadorSeccao() {
    // Procura o contentor ativo consoante a secção onde o utilizador está
    const seccoes = ['corpus', 'escola', 'oficina', 'sobre'];
    let seccaoAtiva = null;
    let container = null;

    for (const sec of seccoes) {
        const el = document.getElementById(`${sec}-content`);
        if (el) {
            seccaoAtiva = sec;
            container = el;
            break;
        }
    }

    if (!container) return; // Ignora se não estiver numa página de secção

    const basePath = getBasePath();
    const urlParams = new URLSearchParams(window.location.search);
    const artigoSlug = urlParams.get('artigo');
    const categoriaFiltro = urlParams.get('cat');

    // --- MODO A: LEITURA INTEGRAL DE ARTIGO (?artigo=slug) ---
    if (artigoSlug) {
        try {
            const res = await fetch(`md/${artigoSlug}.md`);
            if (!res.ok) throw new Error("Ficheiro .md não encontrado no depósito da secção");
            
