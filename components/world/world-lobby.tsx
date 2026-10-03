/* oxlint-disable next/no-img-element -- The Atrium plate is a local, precompressed responsive image; no image service or canvas. */
import Link from 'next/link';
import assets from '@/data/home-chapter-assets.json';
import {
  PLANNED_ROOM_LABEL,
  worldRooms,
  type WorldRoom,
} from '@/data/world-building';
import { LobbyArrival } from './lobby-arrival';
import '@/components/shared/spatial-type.css';
import './world-lobby.css';

const plate = assets['worlds-atrium'];
const openRooms = worldRooms.filter((room) => room.status === 'available');

/** One room, for the spatial directory and the World map alike: open rooms
 * are real links, planned wings are plain text, never placeholder anchors. */
function RoomEntry({
  room,
  className,
  children,
}: {
  room: WorldRoom;
  className: string;
  children: React.ReactNode;
}) {
  return room.href ? (
    <Link className={className} href={room.href} prefetch={false}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

const status = (room: WorldRoom) =>
  room.href ? (
    <>
      Enter <span aria-hidden="true">↗</span>
    </>
  ) : (
    PLANNED_ROOM_LABEL
  );

/** TP3D PASS 05 — The Lobby: a spatial 2.5D shell. The plate layer is the
 * only part a future GLB environment replaces; identity, both navigation
 * modes, room IDs and routes stay as they are. No canvas, no WebGL. */
export function WorldLobby() {
  return (
    <>
      <header className="wl-chrome">
        <Link
          className="wl-wordmark"
          href="/"
          prefetch={false}
          aria-label="Tân Phong home"
        >
          tân phong<span>TP3D · The World</span>
        </Link>
        <div className="wl-controls">
          {/* Fast navigation: every room without walking through a space. */}
          <nav className="wl-map" aria-label="World map">
            <details>
              <summary>
                <span>
                  <span className="wl-wide">World </span>map
                </span>
              </summary>
              <ol className="wl-map-list">
                {worldRooms.map((room) => (
                  <li
                    key={room.id}
                    data-world-room={room.id}
                    data-status={room.status}
                  >
                    <RoomEntry room={room} className="wl-map-entry">
                      <span className="wl-number">{room.number}</span>
                      <span className="wl-map-name">{room.name}</span>
                      <span className="wl-status">{status(room)}</span>
                    </RoomEntry>
                  </li>
                ))}
              </ol>
            </details>
          </nav>
          <Link className="wl-exit" href="/" prefetch={false}>
            <span>
              Exit<span className="wl-wide"> to website</span>
            </span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>
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
                  <span className="wl-status">{status(room)}</span>
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
