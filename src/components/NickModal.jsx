import React, { useState } from 'react';
import socket from '../socket';


const COLORS = ['#60A5FA', '#34D399', '#F472B6', '#FBBF24', '#A78BFA', '#F87171'];


export default function NickModal({ open, onJoin }) {
    const [name, setName] = useState('');
    const [color, setColor] = useState(COLORS[0]);
    const [error, setError] = useState('');


    const checkAndJoin = () => {
        if (!name.trim()) return setError('Введите никнейм');
        // check uniqueness via server
        socket.emit('checkName', name.trim(), (available) => {
            if (!available) return setError('Имя занято, выберите другое');
            onJoin({ name: name.trim(), color });
        });
    };


    if (!open) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="modal modal-open">
                <div className="modal-box bg-base-200">
                    <h3 className="font-bold text-lg">Выберите ник и цвет</h3>
                    <input value={name} onChange={e => { setName(e.target.value); setError('') }} placeholder="Никнейм" className="input input-bordered w-full mt-4" />


                    <div className="mt-4">Цвет:</div>
                    <div className="flex gap-3 mt-2">
                        {COLORS.map(c => (
                            <button key={c} onClick={() => setColor(c)} className={`w-10 h-10 rounded-full border-2 ${color === c ? 'ring ring-offset-2 ring-primary' : ''}`} style={{ backgroundColor: c }} />
                        ))}
                    </div>


                    {error && <div className="text-error mt-2">{error}</div>}
                    <div className="modal-action">
                        <button className="btn" onClick={checkAndJoin}>Join</button>
                    </div>
                </div>
            </div>
        </div>
    );
}