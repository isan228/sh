const { Trainer, Team, Fighter } = require('../models');
const fs = require('fs');
const path = require('path');

// Получение списка тренеров
exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.findAll({
      include: {
        model: Team,
        as: 'team',
        attributes: ['name']
      }
    });
    res.json(trainers);
  } catch (error) {
    res.status(500).send('Ошибка при получении тренеров');
  }
};

// Получение одного тренера по ID
exports.getTrainerById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Trainer ID:', id);

    const trainer = await Trainer.findByPk(id, {
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['name']
        },
        {
          model: Fighter,
          attributes: ['name']
        }
      ]
    });

    if (!trainer) {
      return res.status(404).send('Тренер не найден');
    }

    res.json(trainer);
  } catch (error) {
    console.error('Ошибка при получении тренера:', error);
    res.status(500).send('Ошибка при получении тренера');
  }
};

// Получение бойца по ID
exports.getFighterById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fighter ID:', id);

    const fighter = await Fighter.findByPk(id, {
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['name']
        },
        {
          model: Trainer,
          as: 'trainer',
          attributes: ['name']
        }
      ]
    });

    if (!fighter) {
      return res.status(404).json({ error: 'Боец не найден' });
    }

    res.json(fighter);
  } catch (err) {
    console.error('Ошибка при получении бойца:', err);
    res.status(500).json({ error: 'Ошибка при получении бойца' });
  }
};

exports.addTrainer = async (req, res) => {
  try {
    const { name, experience, teamId } = req.body;
    const photoUrl = req.file ? req.file.path.replace(/\\/g, '/') : null; // Убираем лишние слэши в пути

    const newTrainer = await Trainer.create({
      name,
      experience,
      teamId,
      photo_url: photoUrl, // Сохраняем путь к изображению
    });

    res.status(201).json({
      message: 'Trainer added successfully',
      trainer: newTrainer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding trainer' });
  }
};

exports.updateTrainer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, teamId, experience } = req.body;

    let updatedData = {
      name,
      teamId,
      experience
    };

    // Если файл загружен, обновляем фото
    if (req.file) {
      updatedData.photo_url = req.file.filename;  // Обновляем на поле photo_url
    }

    const trainer = await Trainer.findByPk(id);

    if (!trainer) {
      return res.status(404).send('Тренер не найден');
    }

    // Если загружаем новое фото — удаляем старое
    if (req.file && trainer.photo_url) {
      const oldPhotoPath = path.join(__dirname, '..', 'uploads', trainer.photo_url);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Обновляем тренера в базе данных
    await trainer.update(updatedData);

    // Отправляем обновленного тренера с новым фото (если оно есть)
    res.json({
      id: trainer.id,
      name: trainer.name,
      teamId: trainer.teamId,
      experience: trainer.experience,
      photo_url: trainer.photo_url,  // Передаем путь к фото в ответе
    });
  } catch (error) {
    console.error('Ошибка при обновлении тренера:', error);
    res.status(500).send('Ошибка при обновлении тренера');
  }
};
// Удаление тренера
exports.deleteTrainer = async (req, res) => {
  try {
    const { id } = req.params;
    const trainer = await Trainer.findByPk(id);
    if (!trainer) {
      return res.status(404).send('Тренер не найден');
    }

    // Удаляем фото при удалении тренера
    if (trainer.photo) {
      const photoPath = path.join(__dirname, '..', 'uploads', trainer.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await trainer.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Ошибка при удалении тренера:', error);
    res.status(500).send('Ошибка при удалении тренера');
  }
};
