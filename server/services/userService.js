const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

class UserService {
  async createUser(username, password) {
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    try {
      const user = await prisma.user.create({
        data: {
          username,
          password_hash
        }
      });
      
      return { id: user.id, username: user.username };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('Username already exists');
      }
      throw error;
    }
  }

  async authenticateUser(username, password) {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    return { id: user.id, username: user.username };
  }

  async findUserById(id) {
    // Handle invalid ID types
    if (typeof id !== 'number' || !Number.isInteger(id) || id < 1) {
      return null;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return null;
      }

      return { id: user.id, username: user.username };
    } catch (error) {
      // Handle any database errors gracefully
      return null;
    }
  }
}

module.exports = new UserService();