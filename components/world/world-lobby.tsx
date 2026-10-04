/* oxlint-disable next/no-img-element -- The Atrium plate is a local, precompressed responsive image; no image service or canvas. */
import assets from '@/data/home-chapter-assets.json';
import { worldRooms } from '@/data/world-building';
import { LobbyArrival } from './lobby-arrival';
import { RoomEntry, WorldChrome, roomStatus } from './world-chrome';
import '@/components/shared/spatial-type.css';
import './world-lobby.css';

const plate = assets['worlds-atrium'];
const openRooms = worldRooms.filter((room) => room.status === 'available');

/** TP3D PASS 05 — The Lobby: a spatial 2.5D shell. The plate layer is the
 * only part a future GLB environment replaces; identity, both navigation
 * modes, room IDs and routes stay as they are. No canvas, no WebGL. */
export function WorldLobby() {
  return (
    <>
      <WorldChrome />
      <main id="main" className="world-lobby" data-world-lobby="">
        <LobbyArrival />
        <div className="wl-plate" aria-hidden="true">
          <img
            src={plate.src}
            srcSet={plate.srcSet}
            sizes="100vw"
            width={plate.width}
            height={plate.height}
            alt=""
            decoding="async"
            fetchPriority="high"
          />
        </div>
        <section className="wl-identity" aria-labelledby="world-lobby-title">
          <p className="wl-eyebrow">TP3D</p>
          <h1 id="world-lobby-title">
            The <em>Lobby.</em>
          </h1>
          <p className="wl-lede">
            A digital gallery of spaces, objects, art and experiments.
          </p>
        </section>
        {/* Spatial navigation: the rooms set around the Lobby. */}
        <nav className="wl-rooms" aria-label="Lobby rooms">
          <ol>
            {worldRooms.map((room, index) => (
              <li
                key={room.id}
                className="wl-room"
                data-world-room={room.id}
                data-status={room.status}
                style={{ '--wl-index': index } as React.CSSProperties}
              >
                <RoomEntry room={room} className="wl-room-body">
                  <span className="wl-number">{room.number}</span>
                  <span className="wl-name">{room.name}</span>
                  <span className="wl-summary">{room.summary}</span>
                  <span className="wl-status">{roomStatus(room)}</span>
                </RoomEntry>
              </li>
            ))}
          </ol>
        </nav>
        <p className="wl-meta">
          <span>
            {openRooms.length} of {worldRooms.length} rooms open
          </span>
          <span>Tân Phong · Est. 2026</span>
        </p>
      </main>
    </>
  );
}
