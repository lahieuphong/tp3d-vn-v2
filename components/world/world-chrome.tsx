import Link from 'next/link';
import {
  PLANNED_ROOM_LABEL,
  WORLD_PATH,
  worldRooms,
  type WorldRoom,
  type WorldRoomId,
} from '@/data/world-building';
import './world-chrome.css';

/** One room, for the Lobby's spatial directory and the World map alike: open
 * rooms are real links, planned wings are plain text, never placeholder
 * anchors. The room you are in stays a link, marked `aria-current="page"`. */
export function RoomEntry({
  room,
  className,
  current = false,
  children,
}: {
  room: WorldRoom;
  className: string;
  current?: boolean;
  children: React.ReactNode;
}) {
  return room.href ? (
    <Link
      className={className}
      href={room.href}
      prefetch={false}
      aria-current={current ? 'page' : undefined}
    >
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

export const roomStatus = (room: WorldRoom, current = false) =>
  current ? (
    'You are here'
  ) : room.href ? (
    <>
      Enter <span aria-hidden="true">↗</span>
    </>
  ) : (
    PLANNED_ROOM_LABEL
  );

/** The World's reduced chrome: identity, the World map and a clear exit,
 * always present. Inside a room it adds the way back to the Lobby and marks
 * the current room on the map. */
export function WorldChrome({ currentRoom }: { currentRoom?: WorldRoomId }) {
  return (
    <header className={currentRoom ? 'wl-chrome wl-chrome--room' : 'wl-chrome'}>
      <Link
        className="wl-wordmark"
        href="/"
        prefetch={false}
        aria-label="Tân Phong home"
      >
        tân phong<span>TP3D · The World</span>
      </Link>
      <div className="wl-controls">
        {currentRoom && (
          <Link className="wl-back" href={WORLD_PATH} prefetch={false}>
            <span aria-hidden="true">←</span>
            <span>
              <span className="wl-wide">Back to </span>Lobby
            </span>
          </Link>
        )}
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
                  <RoomEntry
                    room={room}
                    className="wl-map-entry"
                    current={room.id === currentRoom}
                  >
                    <span className="wl-number">{room.number}</span>
                    <span className="wl-map-name">{room.name}</span>
                    <span className="wl-status">
                      {roomStatus(room, room.id === currentRoom)}
                    </span>
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
  );
}
