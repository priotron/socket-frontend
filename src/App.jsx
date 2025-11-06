import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:8000", { transports: ["websocket"] });
const BASE_SPEED = 200;

export default function App() {
  const canvasRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [connected, setConnected] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(
    "#" + Math.floor(Math.random() * 16777215).toString(16)
  );
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [foods, setFoods] = useState([]);

  // подключение сокета
  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("joined", (player) => {
      setMe(player);
      setJoined(true);
    });
    socket.on("stateUpdate", ({ users, foods }) => {
      setUsers(users);
      setFoods(foods);
    });
    socket.on("disconnect", () => setConnected(false));
    return () => {
      socket.off("connect");
      socket.off("joined");
      socket.off("stateUpdate");
      socket.off("disconnect");
    };
  }, []);

  const handleJoin = () => {
    if (!name.trim()) return alert("Введите имя");
    socket.emit("join", { name, color });
  };

  // движение
  useEffect(() => {
    if (!me || !joined) return;

    const keys = new Set();
    const handleKeyDown = (e) => keys.add(e.key.toLowerCase());
    const handleKeyUp = (e) => keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let last = performance.now();
    const loop = (t) => {
      const dt = (t - last) / 1000;
      last = t;

      let dx = 0;
      let dy = 0;
      if (keys.has("w") || keys.has("arrowup")) dy -= 1;
      if (keys.has("s") || keys.has("arrowdown")) dy += 1;
      if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
      if (keys.has("d") || keys.has("arrowright")) dx += 1;

      if (dx || dy) {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;
        const newX = me.x + dx * BASE_SPEED * dt;
        const newY = me.y + dy * BASE_SPEED * dt;
        setMe((prev) => ({ ...prev, x: newX, y: newY }));
        socket.emit("move", { x: newX, y: newY });
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [me, joined]);

  // отрисовка карты
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !me) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      ctx.fillStyle = "#0f172a"; // фон
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const offsetX = me.x - canvas.width / 2;
      const offsetY = me.y - canvas.height / 2;

      // сетка карты
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      for (let x = -offsetX % 100; x < canvas.width; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = -offsetY % 100; y < canvas.height; y += 100) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // еда
      for (const f of foods) {
        ctx.beginPath();
        ctx.arc(f.x - offsetX, f.y - offsetY, f.radius, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.fill();
      }

      // игроки
      for (const u of users) {
        ctx.beginPath();
        ctx.arc(u.x - offsetX, u.y - offsetY, u.radius, 0, Math.PI * 2);
        ctx.fillStyle = u.color;
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(u.name, u.x - offsetX, u.y - offsetY - u.radius - 8);
      }

      requestAnimationFrame(render);
    };
    render();

    return () => window.removeEventListener("resize", resize);
  }, [me, users, foods]);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {!joined ? (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <h1 className="text-3xl font-bold">IO Circle Game</h1>
          <input
            className="w-64 p-2 text-black rounded"
            placeholder="Введите имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <span>Цвет:</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 border-0"
            />
          </div>
          <button
            onClick={handleJoin}
            disabled={!connected}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            {connected ? "Играть" : "Подключение..."}
          </button>
        </div>
      ) : (
        <div className="relative">
          <canvas ref={canvasRef} className="block" />
          <div className="absolute top-4 left-4 bg-slate-800 bg-opacity-60 p-3 rounded">
            <div className="font-bold">{me?.name}</div>
            <div>Score: {me?.score || 0}</div>
            <div>Size: {Math.round(me?.radius || 0)}</div>
          </div>
        </div>
      )}
    </div>
  );
}


export const metadata = {
  title: "Онлайн-магазин услуг | Компания X",
  description: "Удобный заказ и оплата услуг онлайн. Мгновенное бронирование, поддержка 24/7.",
};
