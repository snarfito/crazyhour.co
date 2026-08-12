"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computeNewOrder } from "@/lib/reorder";
import { reorderCategories, deleteCategory } from "./actions";

type Category = { id: string; name: string; slug: string; sort_order: number };

export async function reorderOnDrop(
  items: Category[],
  activeId: string,
  overId: string,
): Promise<Category[]> {
  const fromIndex = items.findIndex((c) => c.id === activeId);
  const toIndex = items.findIndex((c) => c.id === overId);
  const reordered = computeNewOrder(items, fromIndex, toIndex);
  await reorderCategories(reordered.map((c) => c.id));
  return reordered;
}

function SortableRow({ category }: { category: Category }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Arrastrar para reordenar ${category.name}`}
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell>{category.name}</TableCell>
      <TableCell className="text-muted-foreground">{category.slug}</TableCell>
      <TableCell className="flex gap-3">
        <Link href={`/admin/categorias/${category.id}`} className="text-primary hover:underline">
          Editar
        </Link>
        <form action={deleteCategory.bind(null, category.id)}>
          <button type="submit" className="text-destructive hover:underline">
            Eliminar
          </button>
        </form>
      </TableCell>
    </TableRow>
  );
}

export function CategoriasListClient({ categories }: { categories: Category[] }) {
  const [items, setItems] = useState(categories);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const previous = items;
    setError(null);
    try {
      const reordered = await reorderOnDrop(items, String(active.id), String(over.id));
      setItems(reordered);
    } catch {
      setItems(previous);
      setError("No se pudo guardar el nuevo orden. Intenta de nuevo.");
    }
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <TableBody>
              {items.map((category) => (
                <SortableRow key={category.id} category={category} />
              ))}
            </TableBody>
          </SortableContext>
        </Table>
      </DndContext>
    </div>
  );
}
