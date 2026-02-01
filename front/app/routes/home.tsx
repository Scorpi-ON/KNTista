import { Button } from "@heroui/react";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
    return [{ title: "KNTista" }, { name: "description", content: "Домашняя страница" }];
}

export default function Home() {
    return <Button>My Button</Button>;
}
