import CodeEditorPane from './CodeEditorPane';
import DimensionGraphLab from './DimensionGraphLab';

/**
 * PseudoCompilerLayout
 * 
 * The top-level wrapper that renders the Code Editor and the Dimension Flow Graph
 * side-by-side. This component is designed to slot into the existing LabTransitionWrapper
 * as the "compiler" lab view.
 */
export default function PseudoCompilerLayout() {
  return (
    <div className="w-full h-full flex flex-row overflow-hidden bg-slate-950">
      {/* Left Pane: Code Editor (45%) */}
      <div className="w-[45%] h-full border-r border-slate-800 flex flex-col overflow-hidden">
        <CodeEditorPane />
      </div>

      {/* Right Pane: Dimension Flow Graph (55%) */}
      <div className="w-[55%] h-full flex flex-col overflow-hidden">
        <DimensionGraphLab />
      </div>
    </div>
  );
}
