import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createAcademy } from "../actions";

export default function NewAcademyPage() {
  return (
    <>
      <PageHeader title="إضافة أكاديمية جديدة" description="بيانات الأكاديمية الأساسية" />
      <PageBody>
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <form action={async (fd) => { "use server"; await createAcademy(fd); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field name="name" label="اسم الأكاديمية" required />
              <Field name="slug" label="المعرّف (slug)" dir="ltr" required placeholder="my-academy" />
              <Field name="phone" label="الهاتف" dir="ltr" />
              <Field name="whatsapp" label="واتساب" dir="ltr" />
              <Field name="email" label="البريد الإلكتروني" type="email" dir="ltr" />
              <Field name="attendance_lock_minutes" label="دقائق قفل الحضور" type="number" defaultValue="25" />
              <div className="md:col-span-2">
                <Field name="address" label="العنوان" />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit">إنشاء</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.name}>{label}</Label>
      <Input id={props.name} {...props} />
    </div>
  );
}
