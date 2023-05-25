import PropTypes from 'prop-types';
import imagesAPI from 'services/getImages';
import React, { Component } from 'react';
import { ListImageGallery } from './ImageGallery.styled';
import { ImageGalleryItem } from '../ImageGalleryItem/ImageGalleryItem';
import { Loader } from '../Loader/Loader';
import ImageErrorView from 'components/ImageErrorView/ImageErrorView';
import { InitialStateGallery } from '../InitialStateGallery/InitialStateGallery';
import { Button } from 'components/Button/Button';
import Modal from 'components/Modal/Modal';

const Status = {
  IDLE: 'idle',
  PENDING: 'pending',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

export default class ImageGallery extends Component {

  state = {
    value: '',
    images: [],
    error: null,
    status: Status.IDLE,

    page: 1,
    totalPages: 0,

    isShowModal: false,
    modalData: { img: '', tags: '' },
  };

  // перевіряємо, щоб в пропсах змінився запит
  // y static відсутній this, тому дублюємо в state - search: ''
  static getDerivedStateFromProps(nextProps, prevState) {
    if (prevState.value !== nextProps.value) {
      return { page: 1, value: nextProps.value };
    }
    return null;
  }
  //  коли в мене компонент оновлюється componentDidUpdate
  //  (коли міняються пропси або стейт)
  componentDidUpdate(prevProps, prevState) {
    const { page } = this.state;
    // попередній  
    const prevValue = prevProps.value;
    // наступний або поточний
    const nextValue = this.props.value;
    //   страхуємо від повторного запиту, якщо вже таке слово було введене
    if (prevValue !== nextValue || prevState.page !== page) {
        // перед загрузкою ставимо статус PENDING загружаю
      this.setState({ status: Status.PENDING });

      // перевіряємо чи є помилка, якщо є - записуємо null
      if (this.state.error) {
          this.setState({ error: null });
      }
        
      imagesAPI
      // робимо запрос 
      .getImages(nextValue, page)
      .then(images => {
        this.setState(prevState => ({
          images:
          //  якщо  page === 1 то записуємщ перші 12 картинок, якщо ні то
          //   розпиляємо попередні і додаємо 12 новіх
          page === 1 ? images.hits : [...prevState.images, ...images.hits],
          //   загружено
          status: Status.RESOLVED,
          // кількість загрузок
          totalPages: Math.floor(images.totalHits / 12),
        }));
      })
      // відловлюємо помилки і прокидуємо в стейт і статус REJECTED
      .catch(error => this.setState({ error, status: Status.REJECTED }));
    }
  }

  // кастомний метод загрузки з кнопки
  handleLoadMore = () => {
    this.setState(prevState => ({ page: prevState.page + 1 }));
  };
 //для модалкі при сліку на картинку відкривається модалка  
  setModalData = modalData => {
    this.setState({ modalData, isShowModal: true });
  };
 // метод закриття модалки 
  handleModalClose = () => {
    this.setState({ isShowModal: false });
  };

  render() {
    // із стейта витягуємо ключі
    const { images, error, status, page, totalPages, isShowModal, modalData } =
    this.state;
    // якщо статус idle то розмітка така
    if (status === 'idle') {
      return <InitialStateGallery text="Let`s find images together!" />;
    }
    // якщо статус pending тобіш іде загрузка. показуемо спінер
    if (status === 'pending') {
      return <Loader />;
    }
    // якщо статус відхилено виводить меседж
    if (status === 'rejected') {
      return <ImageErrorView message={error.message} />;
    } 
    // якщо в інпут набрано слово без смислу видасть помилку   
    if (images.length === 0) {
      return (
        <ImageErrorView
          message={`Oops... there are no images matching your search... `}
        />
      );
    }
    // якщо все добре повертаємо розмітку
    if (status === 'resolved') {
      return (
        <>
          <ListImageGallery>
          {images.map(image => (
              <ImageGalleryItem
                key={image.id}
                item={image}
                //  при кліку на картинку 
                onImageClick={this.setModalData}
              />
            ))}
          </ListImageGallery> 
          {/* тут показуємо кнопку загрузки по умові */}
           {images.length > 0 && status !== 'pending' && page <= totalPages && (
            <Button onClick={this.handleLoadMore}>Load More</Button>
          )}
            {/* якщо isShowModal true то показуємо модальне вікно */}
           {isShowModal && (
            <Modal modalData={modalData} onModalClose={this.handleModalClose} />
          )}
        </>
      );
    }
  }
}

ImageGallery.propTypes = {
    value: PropTypes.string.isRequired,
};







// <ul class="gallery">
//   {/* <!-- Набір <li> із зображеннями --> */}
// </ul>