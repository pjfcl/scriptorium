/* ==========================================================================
   SCRIPTORIUM DIGITAL — Motor Estático de Leitura de Markdown (app.js)
   Soberania Tecnológica & Slow Web
   ========================================================================== */

// Manifesto com os caminhos dos ficheiros Markdown alojados no repositório
const manifest = [
    'corpus/md/2026-10-22-nomada.md',
    'corpus/md/2026-10-17-arte-social.md',
    'corpus/md/2026-10-16-redes.md',
    'escola/md/2026-10-10-caderno-uab.md',
    'oficina/md/2026-10-05-critical-code.md'
];

/**
 * Extrai metadados YAML (Front Matter) e conteúdo em texto puro
 * @param {string} text Conteúdo bruto do ficheiro .md
 */
function parseMarkdown(text) {
    const regex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
    const match = text.match(regex);
    if (match) {
        return {
            meta: jsyaml.load(match[1]),
            content: match[2]
        };
    }
    return { meta: {}, content: text };
}

/**
 * Lê os ficheiros do manifesto, filtra o artigo mais recente por categoria
 * e gera os cartões clicáveis na capa.
 */
async function carregarUltimasPorCategoria() {
    const container = document.getElementById('entradas-recentes');
    if (!container) return; // Previne erros se o elemento não existir

    let artigos = [];

    // 1. Fetch de cada ficheiro .md
    for (const path of manifest) {
        try {
            const res = await fetch(path);
            if (res.ok) {
                const rawText = await res.text();
                const parsed = parseMarkdown(rawText);
                artigos.push({
                    path: path,
                    slug: path.split('/').pop().replace('.md', ''),
                    section: path.split('/')[0],
                    meta: parsed.meta,
                    content: parsed.content
                });
            }
        } catch (e) {
            console.error("Erro ao carregar ficheiro:", path, e);
        }
    }

    if (artigos.length === 0) {
        container.innerHTML = '<p class="font-mono w3-small" style="color: var(--muted-color);">Nenhum ficheiro Markdown encontrado. Adiciona ficheiros .md às respetivas pastas.</p>';
        return;
    }

    // 2. Ordena por data decrescente (mais recente primeiro)
    artigos.sort((a, b) => new Date(b.meta.date || 0) - new Date(a.meta.date || 0));

    // 3. Filtra apenas 1 artigo mais recente por categoria
    const categoriasVistas = new Set();
    const ultimosPorCategoria = [];

    for (const artigo of artigos) {
        const cat = (artigo.meta.category || 'geral').toLowerCase();
        if (!categoriasVistas.has(cat)) {
            categoriasVistas.add(cat);
            ultimosPorCategoria.push(artigo);
        }
    }

    // 4. Constrói os divs/cartões 100% clicáveis
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

// Inicializa a função assim que o DOM estiver carregado
document.addEventListener('DOMContentLoaded', carregarUltimasPorCategoria);
