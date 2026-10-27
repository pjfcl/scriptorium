/* ==========================================================================
   PAULOLOPES.ORG / SCRIPTORIUM DIGITAL — Motor Universal com Manifesto JSON (app.js)
   Soberania Digital, Humanidades & Arquitetura Estática
   Autor: Paulo Furtado Lopes (mail@paulolopes.org)
   ========================================================================== */

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
            console.error("[Scriptorium] Erro a processar YAML:", e);
        }
    }
    return { meta: {}, content: text };
}

/**
 * Lê o manifest.json e carrega todos os artigos do Scriptorium
 */
async function carregarTodosArtigos() {
    let artigos = [];

    try {
        const manifestRes = await fetch('manifest.json');
        if (!manifestRes.ok) throw new Error("Não foi possível carregar o manifesto.");
        
        const manifestData = await manifestRes.json();
        const entradas = manifestData.artigos || [];

        for (const item of entradas) {
            try {
                const res = await fetch(item.path);
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
                }
            } catch (e) {
                console.error(`[Scriptorium] Erro ao aceder ao artigo ${item.path}:`, e);
            }
        }
    } catch (e) {
        console.error("[Scriptorium] Erro ao carregar manifest.json:", e);
    }

    // Ordenação cronológica decrescente por data
    artigos.sort((a, b) => new Date(b.meta.date || 0) - new Date(a.meta.date || 0));
    return artigos;
}

/* ==========================================================================
   2. MOTOR DA CAPA PRINCIPAL (Home View)
   ========================================================================== */
async function renderizarCapa(artigos) {
    const container = document.getElementById('entradas-recentes');
    if (!container) return;

    if (artigos.length === 0) {
        container.innerHTML = `<p class="font-mono w3-small" style="color: var(--muted-color);">Nenhum registo encontrado no Scriptorium.</p>`;
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

/* ==========================================================================
   3. ROTEADOR SPA (Gestão de Vistas por Parâmetros de URL)
   ========================================================================== */
async function router() {
    const urlParams = new URLSearchParams(window.location.search);
    const seccaoParam = urlParams.get('seccao');
    const artigoParam = urlParams.get('artigo');

    const viewHome = document.getElementById('view-home');
    const viewContent = document.getElementById('view-content');
    const dynamicContainer = document.getElementById('dynamic-container');
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');

    if (!viewHome || !viewContent) return;

    const artigos = await carregarTodosArtigos();

    // CASO A: LEITURA DE UM ARTIGO ESPECÍFICO (?artigo=slug)
    if (artigoParam) {
        viewHome.style.display = 'none';
        viewContent.style.display = 'block';

        const artigo = artigos.find(a => a.slug === artigoParam);
        if (artigo) {
            if (breadcrumbCurrent) breadcrumbCurrent.textContent = artigo.meta.title || artigo.slug;
            
            dynamicContainer.innerHTML = `
                <article>
                    <span class="entry-meta font-mono">${(artigo.meta.category || artigo.section).toUpperCase()} • ${artigo.meta.date || ''}</span>
                    <h2 class="font-sans" style="font-size: 1.8rem; font-weight: 600; color: var(--text-color); margin-top: 0; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                        ${artigo.meta.title || 'Sem título'}
                    </h2>
                    <div class="markdown-body" style="margin-top: 20px;">
                        ${marked.parse(artigo.content)}
                    </div>
                    <div style="margin-top: 40px; border-top: 1px solid var(--border-color); padding-top: 15px;">
                        <a href="index.html" class="font-mono w3-small" style="color: var(--accent-color); text-decoration: none; font-weight: 600;">&larr; Voltar ao Início</a>
                    </div>
                </article>
            `;
        } else {
            dynamicContainer.innerHTML = `
                <div class="w3-padding-24">
                    <p class="font-mono w3-small" style="color: var(--accent-color);">O artigo <code>${artigoParam}</code> não foi encontrado.</p>
                    <a href="index.html" class="font-mono w3-small" style="color: var(--text-color); text-decoration: underline;">&larr; Voltar ao Início</a>
                </div>
            `;
        }
        return;
    }

    // CASO B: LISTAGEM DE UMA SECÇÃO (?seccao=nome)
    if (seccaoParam) {
        viewHome.style.display = 'none';
        viewContent.style.display = 'block';

        if (breadcrumbCurrent) breadcrumbCurrent.textContent = seccaoParam.toUpperCase();

        const filtrados = artigos.filter(a => a.section.toLowerCase() === seccaoParam.toLowerCase());
        
        let htmlOutput = `<h2 class="font-sans" style="font-size: 1.25rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-color); margin-top: 0; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
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
            htmlOutput += `<p class="font-mono w3-small" style="color: var(--muted-color);">Nenhum registo encontrado nesta secção.</p>`;
        }

        htmlOutput += `
            <div style="margin-top: 40px; border-top: 1px solid var(--border-color); padding-top: 15px;">
                <a href="index.html" class="font-mono w3-small" style="color: var(--accent-color); text-decoration: none; font-weight: 600;">&larr; Voltar ao Início</a>
            </div>
        `;

        dynamicContainer.innerHTML = htmlOutput;
        return;
    }

    // CASO C: VISTA DE CAPA PADRÃO
    viewHome.style.display = 'block';
    viewContent.style.display = 'none';
    await renderizarCapa(artigos);
}

/* ==========================================================================
   4. INICIALIZAÇÃO
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    router();
});
