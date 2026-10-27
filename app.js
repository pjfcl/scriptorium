/* ==========================================================================
   PAULOLOPES.ORG / SCRIPTORIUM DIGITAL — Motor Universal (app.js)
   Soberania Digital, Humanidades & Arquitetura Estática
   Autor: Paulo Furtado Lopes (mail@paulolopes.org)
   ========================================================================== */

// 1. MANIFESTO GLOBAL DE FICHEIROS MARKDOWN
// Caminhos universais a partir da raiz de scriptoriumdigital.org
const manifest = [
    // CORPUS (Sementes, Colheitas, Tinturas)
    'corpus/md/20261022_nomada-europeu-de-esquerda.md',
    'corpus/md/20261017_arte-e-social.md',
    'corpus/md/20261016_alguns-problemas-das-redes-sociais.md',
    
    // ESCOLA (Cadernos UAb, Cultura Mediada)
    'escola/md/20261010_caderno-uab-autoetnografia.md',
    
    // OFICINA (Critical Code Studies, Scheme, C/POSIX)
    'oficina/md/20261005_critical-code-studies.md'
];

/**
 * Normaliza caminhos de ficheiro para garantir que o fetch encontra a raiz
 */
function resolveUrl(path) {
    // Se a página atual está dentro de uma subpasta (ex: /corpus/), recua um nível.
    const pathname = window.location.pathname;
    const isSubfolder = pathname.includes('/corpus/') || pathname.includes('/escola/') || pathname.includes('/oficina/') || pathname.includes('/sobre/');
    return isSubfolder ? '../' + path : './' + path;
}

/**
 * Parser de YAML Front Matter e Markdown
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
            console.error("[Scriptorium] Erro YAML:", e);
        }
    }
    return { meta: {}, content: text };
}

/* ==========================================================================
   2. MOTOR DA CAPA PRINCIPAL (index.html)
   ========================================================================== */
async function carregarCapaPrincipal() {
    const container = document.getElementById('entradas-recentes');
    if (!container) return;

    let artigos = [];

    for (const relPath of manifest) {
        try {
            const fetchUrl = resolveUrl(relPath);
            const res = await fetch(fetchUrl);
            
            if (res.ok) {
                const rawText = await res.text();
                const parsed = parseMarkdown(rawText);
                const pathParts = relPath.split('/');

                artigos.push({
                    path: relPath,
                    slug: pathParts.pop().replace('.md', ''),
                    section: pathParts[0],
                    meta: parsed.meta,
                    content: parsed.content
                });
            } else {
                console.warn(`[Scriptorium] HTTP ${res.status} ao carregar: ${fetchUrl}`);
            }
        } catch (e) {
            console.error(`[Scriptorium] Erro ao carregar ${relPath}:`, e);
        }
    }

    if (artigos.length === 0) {
        container.innerHTML = `
            <div class="w3-padding-16">
                <p class="font-mono w3-small" style="color: var(--accent-color);">
                    Nenhum ficheiro Markdown foi carregado.
                </p>
                <p class="font-mono w3-tiny" style="color: var(--muted-color);">
                    Confirma se no GitHub/Servidor o ficheiro se chama exatamente:<br>
                    <code>corpus/md/20261022_nomada-europeu-de-esquerda.md</code> (atenção a maiúsculas na pasta).
                </p>
            </div>
        `;
        return;
    }

    artigos.sort((a, b) => new Date(b.meta.date || 0) - new Date(a.meta.date || 0));

    const categoriasVistas = new Set();
    const ultimosPorCategoria = [];

    for (const artigo of artigos) {
        const cat = (artigo.meta.category || artigo.section || 'geral').toLowerCase();
        if (!categoriasVistas.has(cat)) {
            categoriasVistas.add(cat);
            ultimosPorCategoria.push(artigo);
        }
    }

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

    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const artigoSlug = urlParams.get('artigo');
    const categoriaFiltro = urlParams.get('cat');

    // MODO A: LEITURA INTEGRAL DE ARTIGO (?artigo=slug)
    if (artigoSlug) {
        try {
            const fetchUrl = `./md/${artigoSlug}.md`;
            const res = await fetch(fetchUrl);
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            const rawText = await res.text();
            const parsed = parseMarkdown(rawText);

            const breadcrumbSub = document.getElementById('breadcrumb-sub');
            if (breadcrumbSub) {
                breadcrumbSub.innerHTML = `<a href="index.html">${seccaoAtiva}</a> / ${parsed.meta.category || 'artigo'}`;
            }
            
            container.innerHTML = `
                <article>
                    <span class="entry-meta font-mono">${(parsed.meta.category || seccaoAtiva).toUpperCase()} • ${parsed.meta.date || ''}</span>
                    <h2 class="font-sans" style="font-size: 1.8rem; font-weight: 600; color: var(--text-color); margin-top: 0; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                        ${parsed.meta.title || 'Sem título'}
                    </h2>
                    <div class="markdown-body" style="margin-top: 20px;">
                        ${marked.parse(parsed.content)}
                    </div>
                    <div style="margin-top: 40px; border-top: 1px solid var(--border-color); padding-top: 15px;">
                        <a href="index.html" class="font-mono w3-small" style="color: var(--accent-color); text-decoration: none; font-weight: 600;">&larr; Voltar ao Índice de ${seccaoAtiva.toUpperCase()}</a>
                    </div>
                </article>
            `;
        } catch (e) {
            container.innerHTML = `
                <div class="w3-padding-24">
                    <p class="font-mono w3-small" style="color: var(--accent-color);">O ficheiro <code>${artigoSlug}.md</code> não foi encontrado em <code>${seccaoAtiva}/md/</code>.</p>
                    <a href="index.html" class="font-mono w3-small" style="color: var(--text-color); text-decoration: underline;">&larr; Voltar ao Índice</a>
                </div>
            `;
        }
        return;
    }

    // MODO B: LISTAGEM E FILTRAGEM
    let htmlOutput = `<h2 class="font-sans" style="font-size: 1.25rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-color); margin-top: 0; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        ${categoriaFiltro ? 'Categoria: ' + categoriaFiltro.toUpperCase() : 'Índice Geral de ' + seccaoAtiva.toUpperCase()}
    </h2>`;

    const ficheirosSeccao = manifest.filter(p => p.startsWith(`${seccaoAtiva}/md/`));
    let encontrados = 0;

    for (const relPath of ficheirosSeccao) {
        try {
            const fetchUrl = resolveUrl(relPath);
            const res = await fetch(fetchUrl);
            if (res.ok) {
                const rawText = await res.text();
                const parsed = parseMarkdown(rawText);
                const slug = relPath.split('/').pop().replace('.md', '');
                const cat = (parsed.meta.category || 'geral').toLowerCase();

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
            console.error(`[Scriptorium] Erro em ${seccaoAtiva}:`, relPath, e);
        }
    }

    if (en
