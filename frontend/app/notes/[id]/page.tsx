import NoteDetailPage from '@/components/NoteDetailPage'

export default function Page({ params }: { params: { id: string } }) {
  return <NoteDetailPage id={params.id} />
}
