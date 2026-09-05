"use client";

import { Hotel, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { googleMapsHref } from "@/lib/google-maps.mjs";

type Day = { date:string; city:string };
type HotelItem = { city:string; name:string; address:string; phone:string; mapUrl?:string; googleMapsUrl?:string };

function localIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,"0");
  const d = String(now.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

function pickHotel(city:string, hotels:HotelItem[]) {
  if (/Пекин|Москва/.test(city)) return hotels.find((h)=>/Beijing|Пекин/i.test(h.city));
  if (/Осака|Нара|Хиросима|Himeji/.test(city)) return hotels.find((h)=>/Осака/i.test(h.city));
  if (/Киото/.test(city)) return hotels.find((h)=>/Киото/i.test(h.city));
  if (/Хаконе/.test(city)) return hotels.find((h)=>/Хаконе/i.test(h.city));
  if (/Чэнду/.test(city)) return hotels.find((h)=>/Chengdu|Чэнду/i.test(h.city));
  if (/Токио|Фудзи|Kawaguchiko|Asakusa|Narita/.test(city)) return hotels.find((h)=>/Токио/i.test(h.city));
  return undefined;
}

export function PocketTodayHotel({ days, hotels }: { days:Day[]; hotels:HotelItem[] }) {
  const [today,setToday]=useState("2026-09-05");
  useEffect(()=>setToday(localIsoDate()),[]);
  const day=days.find((d)=>d.date===today);
  const hotel=day ? pickHotel(day.city,hotels) : undefined;
  if (!hotel) return <a href="#hotels" className="today-hotel-quick"><Hotel size={19}/><span><strong>Отели</strong><small>адреса, телефон, карта</small></span></a>;
  const raw=hotel.googleMapsUrl??hotel.mapUrl??`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name}, ${hotel.address}`)}`;
  return <article className="today-hotel-card">
    <div><Hotel size={19}/><span><small>сегодняшний отель</small><strong>{hotel.name}</strong></span></div>
    <p>{hotel.address}</p>
    <div><a href={`tel:${hotel.phone.replace(/\s/g,"")}`}><Phone size={14}/>Позвонить</a><a href={googleMapsHref(raw,`${hotel.name}, ${hotel.address}`)} target="_blank" rel="noreferrer"><MapPin size={14}/>Карта</a></div>
  </article>;
}
