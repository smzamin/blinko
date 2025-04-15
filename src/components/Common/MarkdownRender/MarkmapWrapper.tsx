import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { useEffect, useRef } from 'react';

const transformer = new Transformer();

export const MarkmapWrapper = ({ content }: { content: string }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      svgRef.current.setAttribute('width', '800');
      svgRef.current.setAttribute('height', '600');
      const { root } = transformer.transform(content);
      const mm = Markmap.create(svgRef.current);
      mm.setData(root);
      mm.fit();
    }
  }, [content]);

  return (
    <div className="w-full overflow-auto">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
