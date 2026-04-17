const fs = require('fs');
let code = fs.readFileSync('client-app/js/app-core-v295.js', 'utf8');

// Add error handling and spinner to renderHomeGrids
code = code.replace(/function renderHomeGrids\(productsToRender\) \{/, 
`function renderHomeGrids(productsToRender) {
    console.log("Rendering home grids with", productsToRender ? productsToRender.length : "NO", "products");
    if (!productsToRender || !Array.isArray(productsToRender)) {
        console.error("renderHomeGrids called with invalid data:", productsToRender);
        return;
    }
    try {`);

code = code.replace(/homeGrid\.innerHTML = gridProducts\.map\(p => renderProductCard\(p\)\)\.join\(''\);\s+if \(gridProducts\.length === 0 && scrollProducts\.length === 0\) \{/,
`homeGrid.innerHTML = gridProducts.map(p => renderProductCard(p)).join('');
        
        if (gridProducts.length === 0 && scrollProducts.length === 0) {`);

code = code.replace(/\}\n\s*\}\n\s*\/\/ 2\.10 Slider Logic/, 
`}
    } catch(err) {
        console.error("Error in renderHomeGrids:", err);
    }
}
// 2.10 Slider Logic`);

// Add spinner to fetchProducts and navigate
code = code.replace(/if \(!allProducts \|\| allProducts\.length === 0\) await fetchProducts\(\);/,
`if (!allProducts || allProducts.length === 0) {
            const homeGrid = document.getElementById('home-product-grid');
            if (homeGrid) homeGrid.innerHTML = '<div class="premium-loader" style="margin: 40px auto;"></div>';
            await fetchProducts();
        }`);

fs.writeFileSync('client-app/js/app-core-v296.js', code);
