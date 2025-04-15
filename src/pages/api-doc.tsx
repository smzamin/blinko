import dynamic from "next/dynamic";

const DynamicSwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => <p>Loading Component...</p>,
});

export default function Page() {
  return (
    <section className="overflow-y-scroll h-[100vh]">
      {/* @ts-ignore */}
      <DynamicSwaggerUI url="/api/openapi.json"/>
    </section>
  );
}