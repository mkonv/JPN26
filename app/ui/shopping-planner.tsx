import { ExternalLink, MapPin } from "lucide-react";

type Store = { name: string; address: string; hours: string; products: string; url: string; googleMapsUrl: string; amapUrl?: string; appleMapsUrl?: string };
type Cluster = { name: string; note: string; stores: Store[] };
type City = { id: string; name: string; clusters: Cluster[] };

export function ShoppingPlanner({ cities, principle }: { cities: City[]; principle: string }) {
  return (
    <>
      <section className="page-section first-section shopping-intro">
        <div className="section-heading"><div><span>новый канон</span><h2>Как пользоваться</h2></div></div>
        <p>{principle}</p>
      </section>
      {cities.map((city) => (
        <section className="page-section shopping-city" id={`shopping-${city.id}`} key={city.id}>
          <div className="section-heading"><div><span>город</span><h2>{city.name}</h2></div></div>
          <div className="shopping-clusters">
            {city.clusters.map((cluster) => (
              <article className="shopping-cluster" key={cluster.name}>
                <header><MapPin size={18} /><div><h3>{cluster.name}</h3><p>{cluster.note}</p></div></header>
                <div className="cluster-stores">
                  {cluster.stores.map((store) => (
                    <article className="shopping-store" key={store.name}>
                      <div><strong>{store.name}</strong></div>
                      <address>{store.address}</address><small>{store.hours}</small><p>{store.products}</p>
                      <div className="shopping-store-links">
                        <a href={store.googleMapsUrl} target="_blank" rel="noreferrer"><MapPin size={14} /> Google Maps</a>
                        {store.amapUrl && <a href={store.amapUrl} target="_blank" rel="noreferrer">Amap <ExternalLink size={13} /></a>}
                        {store.appleMapsUrl && <a href={store.appleMapsUrl} target="_blank" rel="noreferrer">Apple Maps <ExternalLink size={13} /></a>}
                        <a href={store.url} target="_blank" rel="noreferrer">Источник <ExternalLink size={13} /></a>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
