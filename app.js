/* ==========================================================================
   SCRIPTORIUM DIGITAL — Motor Universal de Leitura de Markdown (app.js)
   Soberania Tecnológica, Minimalismo & Slow Web
   Autor: Paulo Furtado Lopes (paulolopes.org)
   ========================================================================== */

// 1. MANIFESTO GLOBAL DE FICHEIROS MARKDOWN
// Adiciona aqui os novos ficheiros .md à medida que forem criados nas respetivas pastas.
const manifest = [
    // CORPUS
    'corpus/md/2026-10-22-nomada.md',
    'corpus/md/2026-10-17-arte-social.md',
    'corpus/md/2026-10-16-redes.md',
    
    // ESCOLA
    'escola/md/2026-10-10-caderno-uab.md',
    
    // OFICINA
    'oficina/md/2026-10-05-critical-code.md'
];

/**
 * Utility: Deteta se o script está a correr a partir da raiz ou de uma subpasta
 * @returns {string} Prefixo relativo para caminhos de ficheiros ('./' ou '../')
 */
function getBasePath() {
    const path = window.location.pathname;
    // Se a URL contiver uma das subpastas conhecidas, recua um nível
    if (path.includes('/corpus/') || path.includes('/escola/') || path.includes('/oficina/') || path.includes('/sobre/')) {
        return '../';
    }
    return './';
}

/**
 * Parser de YAML Front Matter e Markdown
 * Separa os metadados contidos entre '---' do corpo do texto em Markdown.
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
            console.error("Erro a processar YAML Front Matter:", e);
        }
    }
    return { meta: {}, content: text };
}

/* ==========================================================================
   2. MOTOR DA CAPA PRINCIPAL (index.html na Raiz)
   ========================================================================== */
async function carregarCapaPrincipal() {
    const container = document.getElementById('entradas-recentes');
    if (!container) return; // Se o container não existir, ignora (não estamos na capa)

    const basePath = getBasePath();
    let artigos = [];

    // Fetch de todos os ficheiros do manifesto
    for (const relPath of manifest) {
        try {
            const fullPath = basePath + relPath;
            const res = await fetch(fullPath);
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
        container.innerHTML = '<p class="font-mono w3-small" style="color: var(--muted-color);">Nenhum ficheiro Markdown encontrado. Adiciona ficheiros .md ao manifesto.</p>';
        return;
    }

    // Ordena os artigos por data decrescente (mais recente primeiro)
    artigos.sort((a, b) => new Date(b.meta.date || 0) - new Date(a.meta.date || 0));

    // Filtra apenas 1 artigo mais recente por categoria
    const categoriasVistas = new Set();
    const ultimosPorCategoria = [];

    for (const artigo of artigos) {
        const cat = (artigo.meta.category || artigo.section || 'geral').toLowerCase();
        if (!categoriasVistas.has(cat)) {
            categoriasVistas.add(cat);
            ultimosPorCategoria.push(artigo);
        }
    }

    // Gerar HTML com cartões 100% clicáveis
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
   3. MOTOR DA SECÇÃO CORPUS (corpus/index.html)
   ========================================================================== */
async function roteadorCorpus() {
    const container = document.getElementById('corpus-content');
    if (!container) return; // Se o container não existir, ignora (não estamos no Corpus)

    const basePath = getBasePath();
    const urlParams = new URLSearchParams(window.location.search);
    const artigoSlug = urlParams.get('artigo');
    const categoriaFiltro = urlParams.get('cat');

    // --- MODO A: LEITURA DE ARTIGO INDIVIDUAL (?artigo=slug) ---
    if (artigoSlug) {
        try {
            // Procura o ficheiro na pasta md/ do Corpus
            const res = await fetch(`md/${artigoSlug}.md`);
            if (!res.ok) throw new Error("Ficheiro .md não encontrado no repositório do Corpus");
            
            const rawText = await res.text();
            const parsed = parseMarkdown(rawText);

            // Atualiza o Breadcrumb superior
            const breadcrumbSub = document.getElementById('breadcrumb-sub');
            if (breadcrumbSub) {
                breadcrumbSub.innerHTML = `<a href="index.html">corpus</a> / ${parsed.meta.category || 'artigo'}`;
            }
            
            // Renderiza o artigo completo em Markdown convertido para HTML
            container.innerHTML = `
                <article>
                    <span class="entry-meta font-mono">${(parsed.meta.category || 'Nota').toUpperCase()} • ${parsed.meta.date || ''}</span>
                    <h2 class="font-sans" style="font-size: 1.8rem; font-weight: 600; color: var(--text-color); margin-top: 0; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                        ${parsed.meta.title || 'Sem título'}
                    </h2>
                    <div class="markdown-body" style="margin-top: 20px;">
                        ${marked.parse(parsed.content)}
                    </div>
                    <div style="margin-top: 40px; border-top: 1px solid var(--border-color); padding-top: 15px;">
                        <a href="index.html" class="font-mono w3-small" style="color: var(--accent-color); text-decoration: none; font-weight: 600;">&larr; Voltar ao Índice do Corpus</a>
                    </div>
                </article>
            `;
        } catch (e) {
            container.innerHTML = `
                <div class="w3-padding-24">
                    <p class="font-mono w3-small" style="color: var(--accent-color);">Ficheiro de artigo não encontrado no depósito do Corpus.</p>
                    <a href="index.html" class="font-mono w3-small" style="color: var(--text-color); text-decoration: underline;">&larr; Voltar ao Índice</a>
                </div>
            `;
        }
        return;
    }

    // --- MODO B: LISTAGEM E FILTRAGEM DE ARTIGOS (Todas ou por Categoria) ---
    let htmlOutput = `<h2 class="font-sans" style="font-size: 1.25rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-color); margin-top: 0; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        ${categoriaFiltro ? 'Categoria: ' + categoriaFiltro.toUpperCase() : 'Todas as Entradas do Corpus'}
    </h2>`;

    // Filtra apenas os ficheiros pertencentes à secção corpus/md/
    const ficheirosCorpus = manifest.filter(p => p.startsWith('corpus/md/'));

    let encontrados = 0;

    for (const relPath of ficheirosCorpus) {
        try {
            // Como o script corre dentro de corpus/index.html, recuamos à raiz e acedemos ao caminho relativo
            const res = await fetch(basePath + relPath);
            if (res.ok) {
                const rawText = await res.text();
                const parsed = parseMarkdown(rawText);
                const slug = relPath.split('/').pop().replace('.md', '');
                const cat = (parsed.meta.category || 'geral').toLowerCase();

                // Aplica o filtro se a URL contiver ?cat=...
                if (!categoriaFiltro || cat === categoriaFiltro.toLowerCase()) {
                    encontrados++;
                    htmlOutput += `
                        <a href="index.html?artigo=${slug}" class="entry-card-link">
                            <div class="entry-card">
                                <span class="entry-meta">${cat.toUpperCase()} • ${parsed.meta.date || ''}</span>
                                <h3>${parsed.meta.title || 'Sem título'}</h3>
                                <p>${parsed.meta.summary || ''}</p>
                            </div>
                        </a>
                    `;
                }
            }
        } catch (e) {
            console.error("Erro ao listar artigo do Corpus:", relPath, e);
        }
    }

    if (encontrados === 0) {
        htmlOutput += `<p class="font-mono w3-small" style="color: var(--muted-color);">Nenhuma entrada encontrada para este filtro no Corpus.</p>`;
    }

    container.innerHTML = htmlOutput;
}

/* ==========================================================================
   4. INICIALIZAÇÃO AUTOMÁTICA DO MOTOR
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    carregarCapaPrincipal(); // Ativado na Capa (index.html na Raiz)
    roteadorCorpus();        // Ativado na secção Corpus (corpus/index.html)
});
