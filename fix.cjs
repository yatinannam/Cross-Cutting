const fs = require('fs');
const files = [
    'src/app/history/page.tsx', 
    'src/app/page.tsx', 
    'src/app/patients/new/page.tsx', 
    'src/app/report/page.tsx', 
    'src/app/results/page.tsx'
];
files.forEach(f => {
    try {
        let c = fs.readFileSync(f, 'utf8');
        c = c.replace(/className="min-h-screen bg-background pb-16 text-slate-900 xl:pb-0"/g, 'className="min-h-screen bg-slate-50 pb-28 text-slate-900 xl:pb-8 pt-4 sm:pt-8 transition-all"');
        c = c.replace(/className="mx-auto flex w-full max-w-6xl gap-4 p-4"/g, 'className="mx-auto flex w-full max-w-7xl flex-col xl:flex-row gap-6 px-4 sm:px-6"');
        fs.writeFileSync(f, c);
    } catch (e) {
        console.log(e);
    }
});
