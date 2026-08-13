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
import { GripVertical, Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DeleteForm } from "@/components/admin/delete-form";
import { computeNewOrder } from "@/lib/reorder";
import { reorderCategories, deleteCategory } from "./actions";

type Category = { id: string; name: string; slug: string; sort_order: number };

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
      <TableCell className="font-medium text-foreground">{category.name}</TableCell>
      <TableCell className="text-muted-foreground">{category.slug}</TableCell>
      <TableCell className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          render={
            <Link href={`/admin/categorias/${category.id}`}>
              <Pencil />
              Editar
            </Link>
          }
        />
        <DeleteForm
          action={deleteCategory.bind(null, category.id)}
          confirmMessage={`¿Eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`}
        />
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

    const fromIndex = items.findIndex((c) => c.id === active.id);
    const toIndex = items.findIndex((c) => c.id === over.id);
    const reordered = computeNewOrder(items, fromIndex, toIndex);

    // Update state immediately so the row doesn't snap back to its old
    // position while the reorder is saved in the background.
    const previous = items;
    setItems(reordered);
    setError(null);
    try {
      await reorderCategories(reordered.map((c) => c.id));
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
