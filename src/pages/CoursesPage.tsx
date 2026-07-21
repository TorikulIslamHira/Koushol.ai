import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { CourseList } from '@/features/courses/components/CourseList'
import { Spinner } from '@/components/ui/Spinner'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

type PriceSort = 'none' | 'low-high' | 'high-low'

/** Course catalog / browse page ("/courses") — search, category filter, price sort, all client-side over the fetched published-course list. */
export function CoursesPage() {
  const { courses, loading, error } = useCourses()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [priceSort, setPriceSort] = useState<PriceSort>('none')

  const categories = useMemo(
    () => Array.from(new Set(courses.map((c) => c.category).filter((c): c is string => !!c))).sort(),
    [courses],
  )

  const filteredCourses = useMemo(() => {
    let result = courses
    if (search.trim()) {
      const query = search.trim().toLowerCase()
      result = result.filter((c) => c.title.toLowerCase().includes(query))
    }
    if (category) {
      result = result.filter((c) => c.category === category)
    }
    if (priceSort !== 'none') {
      result = [...result].sort((a, b) =>
        priceSort === 'low-high' ? a.price - b.price : b.price - a.price,
      )
    }
    return result
  }, [courses, search, category, priceSort])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-brand-ink">{t('courses.title')}</h1>
        {!loading && !error && (
          <p className="mt-1 text-sm text-slate-500">
            {t('courses.count', { count: filteredCourses.length })}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            type="text"
            placeholder={t('courses.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 text-sm"
          />
        </div>
        {categories.length > 0 && (
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-sm"
          >
            <option value="">{t('courses.allCategories')}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        )}
        <Select
          value={priceSort}
          onChange={(e) => setPriceSort(e.target.value as PriceSort)}
          className="text-sm"
        >
          <option value="none">{t('courses.sortDefault')}</option>
          <option value="low-high">{t('courses.sortPriceLowHigh')}</option>
          <option value="high-low">{t('courses.sortPriceHighLow')}</option>
        </Select>
      </div>

      {loading && <Spinner />}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && <CourseList courses={filteredCourses} />}
    </div>
  )
}
