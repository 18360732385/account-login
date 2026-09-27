import type { MouseEvent } from 'react'

export interface NavBarProps {
  path: string
  onNavigate: (to: string) => void
}

const LINKS = [
  { to: '/', label: '首页' },
  { to: '/profile', label: '个人资料' },
]

/** 登录后显示的导航栏（最小 History API 路由，不引路由库）。 */
export function NavBar({ path, onNavigate }: NavBarProps) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>, to: string) {
    e.preventDefault()
    onNavigate(to)
  }

  return (
    <nav className="navbar" aria-label="主导航">
      {LINKS.map((link) => (
        <a
          key={link.to}
          href={link.to}
          aria-current={path === link.to ? 'page' : undefined}
          onClick={(e) => handleClick(e, link.to)}
        >
          {link.label}
        </a>
      ))}
    </nav>
  )
}
