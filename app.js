/* ==========================================================================
   PAULOLOPES.ORG / SCRIPTORIUM DIGITAL — Motor SPA Blindado (app.js)
   Soberania Digital, Humanidades & Arquitetura Estática
   Autor: Paulo Furtado Lopes (mail@paulolopes.org)
   ========================================================================== */

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
            console.error("[Scriptorium] Erro a processar YAML:", e);
        }
    }
    return { meta: {}, content: text };
}

/**
 * Resolve o URL do fetch de forma infalível no GitHub Pages
 */
function resolverUrl(path) {
    if (!path) return '';
    // Se já começa com http ou barra, limpa ou usa direto
    if (path.startsWith('http')) return path;
    const clean = path.startsWith('/') ? path.substring(1) : path;
    return './' + clean;
}

async function carregarTodosArtigos() {
    let artigos = [];

    try {
        const manifestUrl = resolverUrl('manifest.json');
        const manifestRes = await fetch(manifestUrl);
        if (!manifestRes.ok) throw new Error(`HTTP ${manifestRes.status} ao carregar manifest.json em ${manifestUrl}`);
        
        const manifestData = await manifestRes.json();
        const entradas = manifestData.artigos || [];

        for (const item of entradas) {
            try {
                const articleUrl = resolverUrl(item.path);
                const res = await fetch(articleUrl);
                
                if (res.ok) {
                    const rawText = await res.text();
                    const parsed = parseMarkdown(rawText);

                    artigos.push({
                        path: item.path,
                        slug: item.slug,
                        section: item.section,
                        meta: parsed.meta,
                        content: parsed.content
                    });
                } else {
                    console.warn(`[Scriptorium] Aviso: Não foi possível ler ${articleUrl} (HTTP ${res.status})`);
                }
            } catch (e) {
                console.error(`[Scriptorium] Erro ao aceder ao artigo ${item.path}:`, e);
            }
        }
    } catch (e) {
        console.error("[Scriptorium] Erro crítico ao carregar manifesto:", e);
    }

    artigos.sort((a, b) => new Date(b.meta.date || 0) - new Date(a.meta.date || 0));
    return artigos;
}

async function renderizarCapa(artigos) {
    const container = document.getElementById('entradas-recentes');
    if (!container) return;

    if (artigos.length === 0) {
        container.innerHTML = `<p class="font-mono" style="font-size: 0.85rem; color: var(--accent-color);">Nenhum registo encontrado no Scriptorium. (Verifique a consola F12 para detalhes de fetch)</p>`;
        return;
    }

    let htmlOutput = '';
    artigos.slice(0, 5).forEach(artigo => {
        const linkUrl = `index.html?artigo=${artigo.slug}`;
        const catLabel = (artigo.meta.category || artigo.section).toUpperCase();
        
        htmlOutput += `
            <a href="${linkUrl}" class="entry-card-link">
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

async function router() {
    const urlParams = new URLSearchParams(window.location.search);
    const seccaoParam = urlParams.get('seccao');
    const artigoParam = urlParams.get('artigo');

    const viewHome = document.getElementById('view-home');
    const viewContent = document.getElementById('view-content');

    if (!viewHome || !viewContent) return;

    const artigos = await carregarTodosArtigos();

    // LEITURA DE ARTIGO INDIVIDUAL (?artigo=slug)
    if (artigoParam) {
        viewHome.style.display = 'none';
        viewContent.style.display = 'block';

        const artigo = artigos.find(a => a.slug === artigoParam);
        if (artigo) {
            viewContent.innerHTML = `
                <article>
                    <div class="breadcrumb" style="margin-bottom: 20px;">
                        <a href="index.html">Início</a> / <span>${artigo.section}</span>
                    </div>
                    <span class="entry-meta font-mono">${(artigo.meta.category || artigo.section).toUpperCase()} • ${artigo.meta.date || ''}</span>
                    <h2 class="font-sans" style="font-size: 1.8rem; font-weight: 600; color: var(--text-color); margin-top: 0; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                        ${artigo.meta.title || 'Sem título'}
                    </h2>
                    <div class="markdown-body" style="margin-top: 25px; font-size: 1.05rem;">
                        ${marked.parse(artigo.content)}
                    </div>
                    <div style="margin-top: 45px; border-top: 1px solid var(--border-color); padding-top: 15px;">
                        <a href="index.html" class="font-mono" style="font-size: 0.82rem; color: var(--accent-color); text-decoration: none; font-weight: 600;">&larr; Voltar ao Início</a>
                    </div>
                </article>
            `;
        } else {
            viewContent.innerHTML = `
                <div style="padding: 30px 0;">
                    <p class="font-mono" style="font-size: 0.85rem; color: var(--accent-color);">O artigo <code>${artigoParam}</code> não foi encontrado.</p>
                    <a href="index.html" class="font-mono" style="font-size: 0.82rem; color: var(--text-color); text-decoration: underline;">&larr; Voltar ao Início</a>
                </div>
            `;
        }
        return;
    }

    // LISTAGEM DE SECÇÃO (?seccao=nome)
    if (seccaoParam) {
        viewHome.style.display = 'none';
        viewContent.style.display = 'block';

        const filtrados = artigos.filter(a => a.section.toLowerCase() === seccaoParam.toLowerCase());
        
        let htmlOutput = `
            <div class="breadcrumb" style="margin-bottom: 20px;">
                <a href="index.html">Início</a> / <span>${seccaoParam}</span>
            </div>
            <h2 class="font-sans" style="font-size: 1.25rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-color); margin-top: 0; margin-bottom: 25px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                Secção: ${seccaoParam.toUpperCase()}
            </h2>`;

        if (filtrados.length > 0) {
            filtrados.forEach(artigo => {
                const linkUrl = `index.html?artigo=${artigo.slug}`;
                const catLabel = (artigo.meta.category || artigo.section).toUpperCase();
                htmlOutput += `
                    <a href="${linkUrl}" class="entry-card-link">
                        <div class="entry-card">
                            <span class="entry-meta">${catLabel} • ${artigo.meta.date || ''}</span>
                            <h3>${artigo.meta.title || 'Sem título'}</h3>
                            <p>${artigo.meta.summary || ''}</p>
                        </div>
                    </a>
                `;
            });
        } else {
            htmlOutput += `<p class="font-mono" style="font-size: 0.85rem; color: var(--muted-color);">Nenhum registo encontrado nesta secção.</p>`;
        }

        htmlOutput += `
            <div style="margin-top: 45px; border-top: 1px solid var(--border-color); padding-top: 15px;">
                <a href="index.html" class="font-mono" style="font-size: 0.82rem; color: var(--accent-color); text-decoration: none; font-weight: 600;">&larr; Voltar ao Início</a>
            </div>
        `;

        viewContent.innerHTML = htmlOutput;
        return;
    }

    // VISTA DE CAPA PADRÃO
    viewHome.style.display = 'block';
    viewContent.style.display = 'none';
    await renderizarCapa(artigos);
}

document.addEventListener('DOMContentLoaded', () => {
    router();
});
