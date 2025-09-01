import { Hono } from 'hono'
import { UserModel } from '@/models/User'

const users = new Hono()

// Get user's location preference
users.get('/:userId/location', async (c) => {
  try {
    const userId = c.req.param('userId')
    
    if (!userId) {
      return c.json({
        success: false,
        error: 'User ID is required'
      }, 400)
    }

    const locationPref = await UserModel.getLocationPreference(userId)
    
    if (!locationPref) {
      return c.json({
        success: false,
        error: 'User not found or no location preference set'
      }, 404)
    }
    
    return c.json({
      success: true,
      data: locationPref
    })
  } catch (error) {
    console.error('Get user location preference error:', error)
    return c.json({
      success: false,
      error: 'Failed to get user location preference'
    }, 500)
  }
})

// Update user's location preference
users.put('/:userId/location', async (c) => {
  try {
    const userId = c.req.param('userId')
    const body = await c.req.json()
    const { location, latitude, longitude } = body
    
    if (!userId) {
      return c.json({
        success: false,
        error: 'User ID is required'
      }, 400)
    }

    if (!location) {
      return c.json({
        success: false,
        error: 'Location is required'
      }, 400)
    }

    const updatedUser = await UserModel.updateLocationPreference(
      userId, 
      location, 
      latitude, 
      longitude
    )
    
    if (!updatedUser) {
      return c.json({
        success: false,
        error: 'Failed to update location preference'
      }, 500)
    }
    
    return c.json({
      success: true,
      data: {
        default_location: updatedUser.default_location,
        default_latitude: updatedUser.default_latitude,
        default_longitude: updatedUser.default_longitude
      }
    })
  } catch (error) {
    console.error('Update user location preference error:', error)
    return c.json({
      success: false,
      error: 'Failed to update user location preference'
    }, 500)
  }
})

export { users }