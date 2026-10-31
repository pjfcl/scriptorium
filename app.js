/* ==========================================================================
   PAULOLOPES.ORG / SCRIPTORIUM DIGITAL — Motor SPA Blindado com Pesquisa (app.js)
   Soberania Digital, Humanidades & Arquitetura Estática
   Autor: Paulo Furtado Lopes (mail@paulolopes.org)
   ========================================================================== */

function parseMarkdown(text) {
    // Remover BOM do UTF-8 se existir no início do ficheiro
    const cleanText = text.replace(/^\uFEFF/, '');
    
    // Regex flexível para aceitar espaços ou quebras iniciais antes do frontmatter
    const regex = /^\s*---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/;
    const match = cleanText.match(regex);
    
    if (match) {
        try {
            const rawMeta = jsyaml.load(match[1]) || {};
            const meta = {};
            for (const key of Object.keys(rawMeta)) {
                meta[key.toLowerCase()] = rawMeta[key];
            }
            
            // Limpeza rigorosa do conteúdo para remover qualquer vestígio de frontmatter remanescente
            let cleanContent = match[2].trim();
            if (cleanContent.startsWith('---')) {
                const secondDash = cleanContent.indexOf('---', 3);
                if (secondDash !== -1) {
                    cleanContent = cleanContent.substring(secondDash + 3).trim();
                }
            }

            return {
                meta: meta,
                content: cleanContent
            };
        } catch (e) {
            console.error("[Scriptorium] Erro a processar YAML:", e);
        }
    }
    
    // Fallback absoluto caso o ficheiro não tenha frontmatter delimitado
    return { meta: {}, content: cleanText.trim() };
}

/**
 * Resolve o URL do fetch de forma infalível em subdiretórios e Hostinger
 */
function resolverUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const clean = path.startsWith('/') ? path.substring(1) : path;
    const pathname = window.location.pathname;
    const baseDir = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    return baseDir + clean;
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

                    // Extrair título e data com fallbacks inteligentes baseados no slug se faltarem no frontmatter
                    const tituloRaw = parsed.meta.title || item.slug.replace(/^[0-9]+_/, '').replace(/[-_]/g, ' ');
                    const tituloFormatado = String(tituloRaw).charAt(0).toUpperCase() + String(tituloRaw).slice(1);
                    
                    const dataRaw = parsed.meta.date || parsed.meta.published || '';
                    const sumarioRaw = parsed.meta.summary || parsed.content.replace(/^#+\s+.*/gm, '').trim().substring(0, 140) + '...';

                    artigos.push({
                        path: item.path,
                        slug: item.slug,
                        section: item.section.toLowerCase(),
                        meta: {
                            ...parsed.meta,
                            title: tituloFormatado,
                            date: dataRaw,
                            summary: sumarioRaw
                        },
                        content: parsed.content
                    });
                }
            } catch (e) {
                console.error(`[Scriptorium] Erro ao aceder ao artigo ${item.path}:`, e);
            }
        }
    } catch (e) {
        console.error("[Scriptorium] Erro crítico ao carregar manifesto:", e);
    }

    // Ordenar por data decrescente com suporte rigoroso a datas ISO
    artigos.sort((a, b) => {
        const d1 = a.meta.date ? new Date(a.meta.date) : new Date(0);
        const d2 = b.meta.date ? new Date(b.meta.date) : new Date(0);
        return d2 - d1;
    });
    
    return artigos;
}

async function renderizarCapa(artigos) {
    const container = document.getElementById('entradas-recentes');
    if (!container) return;

    if (artigos.length === 0) {
        container.innerHTML = `<p class="font-mono" style="font-size: 0.85rem; color: var(--accent-color);">Nenhum registo encontrado no Scriptorium.</p>`;
        return;
    }

    // Filtrar estritamente o ÚLTIMO artigo de cada categoria/secção
    const sementes = artigos.filter(a => (a.meta.type || '').toLowerCase() === 'semente' || (a.meta.category || '').toLowerCase() === 'semente');
    const colheitas = artigos.filter(a => a.section === 'corpus' && (a.meta.type || '').toLowerCase() !== 'semente' && (a.meta.type || '').toLowerCase() !== 'tintura');
    const tinturas = artigos.filter(a => (a.meta.type || '').toLowerCase() === 'tintura' || (a.meta.category || '').toLowerCase() === 'tintura');
    const escola = artigos.filter(a => a.section === 'escola');
    const oficina = artigos.filter(a => a.section === 'oficina');
    const sobre = artigos.filter(a => a.section === 'sobre');

    const ultimosArtigos = [
        sementes[0],
        colheitas[0],
        tinturas[0],
        escola[0],
        oficina[0],
        sobre[0]
    ].filter(Boolean);

    let htmlOutput = '';

    ultimosArtigos.forEach(artigo => {
        const linkUrl = `index.html?artigo=${artigo.slug}`;
        const catLabel = (artigo.meta.category || artigo.section).toUpperCase();
        const dataArtigo = artigo.meta.date || '';
        
        htmlOutput += `
            <a href="${linkUrl}" class="entry-card-link">
                <div class="entry-card">
                    <span class="entry-meta">${catLabel} • ${dataArtigo}</span>
                    <h3>${artigo.meta.title}</h3>
                    <p>${artigo.meta.summary || ''}</p>
                </div>
            </a>
        `;
    });

    container.innerHTML = htmlOutput;
}

/**
 * Motor de Pesquisa baseado no search-index.json gerado por Chez Scheme
 */
async function executarPesquisa(termo) {
    const viewHome = document.getElementById('view-home');
    const viewContent = document.getElementById('view-content');
    
    viewHome.style.display = 'none';
    viewContent.style.display = 'block';

    viewContent.innerHTML = `
        <div class="breadcrumb" style="margin-bottom: 20px;">
            <a href="index.html">Início</a> / <span>Pesquisa</span>
        </div>
        <h2 class="font-sans" style="font-size: 1.25rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-color); margin-top: 0; margin-bottom: 25px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
            Resultados para: "${termo}"
        </h2>
        <div id="resultados-pesquisa">
            <p class="font-mono" style="font-size: 0.85rem; color: var(--muted-color);">A consultar o índice do Chez Scheme...</p>
        </div>
    `;

    try {
        const res = await fetch(resolverUrl('search-index.json'));
        if (!res.ok) throw new Error("Não foi possível carregar o índice de pesquisa.");
        
        const indexData = await res.json();
        const termoLower = termo.toLowerCase();

        const filtrados = indexData.filter(item => {
            const titulo = (item.title || "").toLowerCase();
            const conteudo = (item.content || "").toLowerCase();
            return titulo.includes(termoLower) || conteudo.includes(termoLower);
        });

        const containerResultados = document.getElementById('resultados-pesquisa');
        if (!containerResultados) return;

        if (filtrados.length === 0) {
            containerResultados.innerHTML = `
                <p class="font-mono" style="font-size: 0.85rem; color: var(--accent-color);">Nenhum ensaio ou registo encontrado com o termo "<strong>${termo}</strong>".</p>
                <div style="margin-top: 30px;">
                    <a href="index.html" class="font-mono" style="font-size: 0.82rem; color: var(--accent-color); text-decoration: none; font-weight: 600;">&larr; Voltar ao Início</a>
                </div>
            `;
            return;
        }

        let htmlOutput = '';
        filtrados.forEach(item => {
            htmlOutput += `
                <a href="index.html?artigo=${item.url.split('/').pop().replace('.html', '')}" class="entry-card-link">
                    <div class="entry-card">
                        <span class="entry-meta">${item.category.toUpperCase()}</span>
                        <h3>${item.title}</h3>
                        <p style="font-size: 0.9rem; color: var(--muted-color);">${item.content.substring(0, 160)}...</p>
                    </div>
                </a>
            `;
        });

        htmlOutput += `
            <div style="margin-top: 45px; border-top: 1px solid var(--border-color); padding-top: 15px;">
                <a href="index.html" class="font-mono" style="font-size: 0.82rem; color: var(--accent-color); text-decoration: none; font-weight: 600;">&larr; Voltar ao Início</a>
            </div>
        `;

        containerResultados.innerHTML = htmlOutput;

    } catch (e) {
        console.error("[Scriptorium] Erro na pesquisa:", e);
        document.getElementById('resultados-pesquisa').innerHTML = `
            <p class="font-mono" style="font-size: 0.85rem; color: var(--accent-color);">Erro ao processar o índice de pesquisa.</p>
        `;
    }
}

async function router() {
    const urlParams = new URLSearchParams(window.location.search);
    const seccaoParam = urlParams.get('seccao');
    const artigoParam = urlParams.get('artigo');
    const qParam = urlParams.get('q');

    const viewHome = document.getElementById('view-home');
    const viewContent = document.getElementById('view-content');

    if (!viewHome || !viewContent) return;

    if (qParam) {
        await executarPesquisa(qParam.trim());
        return;
    }

    const artigos = await carregarTodosArtigos();

    if (artigoParam) {
        viewHome.style.display = 'none';
        viewContent.style.display = 'block';

        const artigo = artigos.find(a => a.slug === artigoParam);
        if (artigo) {
            const dataArtigo = artigo.meta.date || '';
            viewContent.innerHTML = `
                <article>
                    <div class="breadcrumb" style="margin-bottom: 20px;">
                        <a href="index.html">Início</a> / <span>${artigo.section}</span>
                    </div>
                    <span class="entry-meta font-mono">${(artigo.meta.category || artigo.section).toUpperCase()} • ${dataArtigo}</span>
                    <h2 class="font-sans" style="font-size: 1.8rem; font-weight: 600; color: var(--text-color); margin-top: 0; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                        ${artigo.meta.title}
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
                const dataArtigo = artigo.meta.date || '';
                htmlOutput += `
                    <a href="${linkUrl}" class="entry-card-link">
                        <div class="entry-card">
                            <span class="entry-meta">${catLabel} • ${dataArtigo}</span>
                            <h3>${artigo.meta.title}</h3>
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

    viewHome.style.display = 'block';
    viewContent.style.display = 'none';
    await renderizarCapa(artigos);
}

document.addEventListener('DOMContentLoaded', () => {
    router();
});
