import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import pb from '../utils/pb'

const useBookStore = create(
  persist(
    (set, get) => ({
      books: [],
      
      fetchBooks: async () => {
        try {
          const records = await pb.collection('books').getFullList();
          // PocketBase 400 default fix: reverse locally
          const activeBooks = records.filter(b => !b.isArchived).reverse();
          set({ books: activeBooks });
        } catch (e) {
          console.error('Failed to fetch books from PocketBase', e);
        }
      },
      
      getBookById: (id) => get().books.find((b) => b.bookId === id || b.id === id),
      
      addBook: async (bookData) => {
        try {
          const newBook = await pb.collection('books').create({
            bookId: bookData.bookId || `bk_${Date.now()}`,
            title: bookData.title,
            cover: bookData.cover || '',
            subject: bookData.subject || '',
            desc: bookData.desc || '',
            rewardPoints: bookData.rewardPoints || 200,
          });
          set({ books: [newBook, ...get().books] });
          return newBook;
        } catch (e) {
          console.error('Failed to add book', e);
          throw e;
        }
      },

      updateBook: async (id, data) => {
        try {
          const book = get().books.find(b => b.id === id);
          if (book) {
             const updatedBook = await pb.collection('books').update(id, data);
             set({ books: get().books.map(b => b.id === id ? updatedBook : b) });
             return updatedBook;
          }
        } catch (e) {
          console.error('Failed to update book', e);
        }
      },

      archiveBook: async (id) => {
        try {
          const updatedBook = await pb.collection('books').update(id, { isArchived: true });
          set({ books: get().books.filter(b => b.id !== id) });
          return updatedBook;
        } catch (e) {
            console.error('Failed to archive book', e);
        }
      },

      deleteBook: async (id) => {
        try {
          await pb.collection('books').delete(id);
          set({ books: get().books.filter((b) => b.id !== id) });
        } catch (e) {
           console.error('Failed to delete book', e);
        }
      }
    }),
    {
      name: 'daily-reading-books-v1',
      partialize: (state) => ({ }), // Do not persist books locally to prevent stale data
    }
  )
)

export default useBookStore
