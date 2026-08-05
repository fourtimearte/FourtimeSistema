import { cn } from '@/lib/utils'

/** Campo de texto. A altura sai de `--ft-control-h`, então ele encolhe
 *  junto com a densidade sem que ninguém precise passar tamanho. */
function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(
        'border-input bg-background h-(--ft-control-h) w-full min-w-0 rounded-lg border px-3 text-[13px] transition-[border-color,box-shadow] outline-none',
        'placeholder:text-muted-foreground',
        'focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[3px]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        /* erro é estado do campo, não classe extra: quem valida marca
           aria-invalid e o visual vem junto */
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-[3px]',
        className,
      )}
      {...props}
    />
  )
}

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input bg-background min-h-16 w-full rounded-lg border px-3 py-2 text-[13px] transition-[border-color,box-shadow] outline-none',
        'placeholder:text-muted-foreground',
        'focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[3px]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-[3px]',
        className,
      )}
      {...props}
    />
  )
}

export { Input, Textarea }
