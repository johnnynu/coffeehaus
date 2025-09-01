import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import ClerkProviderWrapper from './components/ClerkProvider'
import HomePage from './pages/HomePage'
import SearchResultsPage from './pages/SearchResultsPage'
import CoffeeShopDetailPage from './pages/CoffeeShopDetailPage'
import SignIn from './components/auth/SignIn'
import SignUp from './components/auth/SignUp'

function App() {
  return (
    <ClerkProviderWrapper>
      <ThemeProvider defaultTheme="light" storageKey="coffeehaus-ui-theme">
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/coffee-shop/:id" element={<CoffeeShopDetailPage />} />
            <Route path="/sign-in/*" element={<SignIn />} />
            <Route path="/sign-up/*" element={<SignUp />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </ClerkProviderWrapper>
  )
}

export default App
