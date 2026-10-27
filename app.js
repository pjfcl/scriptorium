/* Adicionar ou atualizar este bloco no teu app.js */

async function roteadorCorpus() {
    const container = document.getElementById('corpus-content');
    if (!container) return; // Se não estivermos na página do Corpus, sai sem fazer nada

    const urlParams = new URLSearchParams(window.location.search);
    const artigoSlug = urlParams.get('artigo');
    const categoriaFiltro = urlParams.get('cat');

    // MODO 1: LEITURA DE UM ARTIGO INDIVIDUAL
    if (artigoSlug) {
        try {
            const res = await fetch(`md/${artigoSlug}.md`);
            if (!res.ok) throw new Error("Artigo não encontrado");
            const rawText = await res.text();
            const parsed = parseMarkdown(rawText);

            document.getElementById('breadcrumb-sub').innerHTML = `<a href="index.html">corpus</a> / ${parsed.meta.category || 'artigo'}`;
            
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
            container.innerHTML = `<p class="font-mono w3-small" style="color: var(--accent-color);">Ficheiro de artigo não encontrado no depósito do Corpus.</p>`;
        }
        return;
    }

    // MODO 2: LISTAGEM E FILTRAGEM DE ARTIGOS
    let htmlOutput = `<h2 class="font-sans" style="font-size: 1.25rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-color); margin-top: 0; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        ${categoriaFiltro ? 'Categoria: ' + categoriaFiltro.toUpperCase() : 'Todas as Entradas do Corpus'}
    </h2>`;

    // Filtra apenas ficheiros que pertençam à pasta corpus
    const ficheirosCorpus = manifest.filter(p => p.startsWith('corpus/md/'));

    let encontrados = 0;
    for (const path of ficheirosCorpus) {
        try {
            const res = await fetch(`../${path}`);
            if (res.ok) {
                const rawText = await res.text();
                const parsed = parseMarkdown(rawText);
                const slug = path.split('/').pop().replace('.md', '');
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
        } catch (e) {}
    }

    if (encontrados === 0) {
        htmlOutput += `<p class="font-mono w3-small" style="color: var(--muted-color);">Nenhuma entrada encontrada para este filtro.</p>`;
    }

    container.innerHTML = htmlOutput;
}

// Inicialização automática do roteador
document.addEventListener('DOMContentLoaded', () => {
    carregarUltimasPorCategoria(); // Para a Capa (index.html da raiz)
    roteadorCorpus();              // Para o Corpus (corpus/index.html)
});
