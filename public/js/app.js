document.addEventListener('DOMContentLoaded', function() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetView = this.id.replace('-btn', '-view');
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            views.forEach(view => view.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(targetView).classList.add('active');
        });
    });
});

async function checkServerStatus() {
    const resultDiv = document.getElementById('status-result');
    
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        resultDiv.innerHTML = `
            <div style="color: green; background: #d4edda; padding: 10px; border-radius: 4px;">
                ✓ ${data.message}
            </div>
        `;
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="color: red; background: #f8d7da; padding: 10px; border-radius: 4px;">
                ✗ Error: ${error.message}
            </div>
        `;
    }
}