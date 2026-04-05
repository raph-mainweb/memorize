export const metadata = {
  title: 'Über uns | Nachklang CH',
  description: 'Wer hinter Nachklang CH steckt und warum wir diese Plattform ins Leben gerufen haben.',
};

export default function AboutPage() {
  return (
    <div className="flex-grow flex flex-col items-center bg-stone-50 py-24">
      <div className="max-w-3xl w-full px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-serif text-slate-900 mb-8 tracking-tight">Über Nachklang</h1>
        <p className="text-slate-600 text-lg md:text-xl font-light leading-relaxed mb-6">
          Wir glauben daran, dass Erinnerungen einen festen Platz im Leben verdienen. Unsere Plattform kombiniert die Tradition des Gedenkens mit modernen, analogen Medaillons.
        </p>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 mt-12">
           <h2 className="text-2xl font-serif text-slate-800 mb-4">Unsere Mission</h2>
           <p className="text-slate-500 leading-relaxed font-light text-left">
             [Platzhalter: Hier kommt der tiefgründige Text über das Team und die Philosophie von Nachklang CH hin. Erklären Sie, warum Sie die Plattform gebaut haben und welchen Mehrwert Sie den Hinterbliebenen in der Schweiz bieten wollen.]
           </p>
        </div>
      </div>
    </div>
  );
}
