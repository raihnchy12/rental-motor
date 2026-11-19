"use client";

// TODO: Hapus halaman sementara /ui-check ini sebelum go-live
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AlertCircle, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function UiCheckPage() {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const { register, handleSubmit } = useForm<{ nama: string }>({
    defaultValues: { nama: "" },
  });

  function onSubmit(values: { nama: string }) {
    toast.success(`Form terkirim: ${values.nama || "(kosong)"}`);
  }

  return (
    <main className="container mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">UI Check — Komponen Dasar</h1>
        <p className="text-muted-foreground text-sm">
          Halaman verifikasi visual komponen shadcn/ui (hapus sebelum go-live).
        </p>
      </div>

      {/* Alert & Badge */}
      <section className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Info Sistem</AlertTitle>
          <AlertDescription>
            Komponen Alert dan Badge berhasil dirender dengan Tailwind 4.
          </AlertDescription>
        </Alert>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </section>

      {/* Button, Toast, Dialog, Sheet, Dropdown, Popover */}
      <section className="flex flex-wrap gap-3">
        <Button onClick={() => toast.info("Notifikasi Sonner aktif!")}>Tes Sonner Toast</Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Buka Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contoh Dialog</DialogTitle>
              <DialogDescription>Dialog berjalan normal tanpa error.</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Buka Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Contoh Sheet</SheetTitle>
              <SheetDescription>Panel samping responsif untuk mobile/detail.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              Dropdown <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Opsi 1</DropdownMenuItem>
            <DropdownMenuItem>Opsi 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Buka Popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 text-sm">Konten popover berhasil tampil.</PopoverContent>
        </Popover>
      </section>

      {/* Card, Form, Input, Label, Select, Textarea */}
      <Card>
        <CardHeader>
          <CardTitle>Form & Input</CardTitle>
          <CardDescription>
            Uji integrasi react-hook-form dengan komponen shadcn/ui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Penyewa</Label>
              <Input id="nama" placeholder="Contoh: Budi Santoso" {...register("nama")} />
            </div>

            <div className="space-y-2">
              <Label>Tipe Motor</Label>
              <Select defaultValue="matic">
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matic">Matic 125cc</SelectItem>
                  <SelectItem value="bebek">Bebek 110cc</SelectItem>
                  <SelectItem value="sport">Sport 150cc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catatan">Catatan Tambahan</Label>
              <Textarea id="catatan" placeholder="Tulis catatan..." />
            </div>

            <Button type="submit">Kirim Form Uji</Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabs & Table */}
      <Tabs defaultValue="tabel">
        <TabsList>
          <TabsTrigger value="tabel">Tabel</TabsTrigger>
          <TabsTrigger value="kalender">Kalender</TabsTrigger>
          <TabsTrigger value="skeleton">Skeleton</TabsTrigger>
        </TabsList>

        <TabsContent value="tabel" className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plat Nomor</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>AB 1234 XY</TableCell>
                <TableCell>Matic 125cc</TableCell>
                <TableCell>
                  <Badge>READY</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="kalender" className="pt-4">
          <div className="inline-block rounded-md border p-2">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} />
          </div>
        </TabsContent>

        <TabsContent value="skeleton" className="space-y-2 pt-4">
          <Skeleton className="h-6 w-1/3 bg-slate-300 dark:bg-slate-700" />
          <Skeleton className="h-20 w-full bg-slate-300 dark:bg-slate-700" />
        </TabsContent>
      </Tabs>
    </main>
  );
}
