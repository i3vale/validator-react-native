import * as React from 'react';
import { NavigationScreenProps } from 'react-navigation';
import Title from '../../../components/Title';
import { FormLabel, FormInput, FormValidationMessage, Button } from 'react-native-elements';
import Form from '../../../components/Form/Form';
import { isMobilePhone } from 'validator';
import ImagePicker from '../../../components/MyImagePicker';
import styled from 'styled-components/native';
import { SafeAreaView, Alert, AsyncStorage } from 'react-native';
import { color } from '../../../theme';
import TouchID from 'react-native-touch-id';
import { post } from '../../../utils/fetch';
import { ResponseCode } from '../../../utils/interface';
import { PRIVATE_KEY_LABEL } from '../../../utils/config';
import { RSA, RSAKeychain } from 'react-native-rsa-native';
import { state } from '../../../utils/store';

const ID_CARD_REGEX = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;

export interface InputInfoProps extends NavigationScreenProps {}

export interface InputInfoState {
	phoneNumber: string;
	idCardNumber: string;
	idCardFrontPicture: string;
	idCardBehindPicture: string;
	phoneNumberErrorMessage: string;
	idCardNumberErrorMessage: string;
	idCardFrontPictureErrorMessage: string;
	idCardBehindPictureErrorMessage: string;
	loading: number;
}

export default class InputInfo extends React.Component<InputInfoProps, InputInfoState> {
	constructor(props: InputInfoProps) {
		super(props);

		this.state = {
			phoneNumber: null,
			idCardNumber: null,
			idCardFrontPicture: '',
			idCardBehindPicture: '',
			phoneNumberErrorMessage: '',
			idCardNumberErrorMessage: '',
			idCardFrontPictureErrorMessage: '',
			idCardBehindPictureErrorMessage: '',
			loading: 0,
		};
	}

	onPhoneNumberChange = (text: string) => {
		this.setState({
			phoneNumber: text,
		});
		if (text && !isMobilePhone(text, 'zh-CN')) {
			this.setState({
				phoneNumberErrorMessage: '请输入有效的手机号',
			});
		} else {
			this.setState({
				phoneNumberErrorMessage: '',
			});
		}
	};

	onIdCardNumberChange = (text: string) => {
		this.setState({
			idCardNumber: text,
		});
		if (text && !ID_CARD_REGEX.test(text)) {
			this.setState({
				idCardNumberErrorMessage: '请输入有效身份证号',
			});
		} else {
			this.setState({
				idCardNumberErrorMessage: '',
			});
		}
	};

	onIdCardPictureFrontChange = (text: string) => {
		this.setState({
			idCardFrontPictureErrorMessage: '',
			idCardFrontPicture: text,
		});
	};

	onIdCardPictureBehindChange = (text: string) => {
		this.setState({
			idCardBehindPictureErrorMessage: '',
			idCardBehindPicture: text,
		});
	};

	get isValid() {
		return (
			this.state.idCardNumber &&
			this.state.phoneNumber &&
			this.state.idCardBehindPicture &&
			this.state.idCardFrontPicture &&
			!this.state.phoneNumberErrorMessage &&
			!this.state.idCardNumberErrorMessage &&
			!this.state.idCardFrontPictureErrorMessage &&
			!this.state.idCardBehindPictureErrorMessage
		);
	}

	onSubmit = async () => {
		if (this.isValid) {
			if (!await TouchID.isSupported) {
				Alert.alert('无法提交', '您的设备不支持生物加密技术, 请更换设备');
			} else {
				this.setState({
					loading: this.state.loading + 1,
				});
				try {
					const isAuthenticate = await TouchID.authenticate('请进行生物认证', {
						color: color.primary,
						fallbackTitle: '',
					});
					if (isAuthenticate) {
						/** 生成RSA秘钥对 */
						const keys = await RSA.generateKeys(4096);

						const res = await post('/user/confirm', {
							phoneNumber: this.state.phoneNumber,
							idCardNumber: this.state.idCardNumber,
							publicKey: keys.public,
						});

						const data = await res.json();
						switch (data.code) {
							case ResponseCode.SUCCESS:
								await AsyncStorage.setItem(PRIVATE_KEY_LABEL, keys.private);
								Alert.alert('认证成功');
								state.user = null;
								this.props.navigation.navigate('AuthLoading');
								break;

							default:
								Alert.alert('认证失败', '请再次尝试');
								break;
						}
					} else {
						Alert.alert('认证失败', '请再次尝试');
					}
				} catch (error) {
					console.error(error);
					Alert.alert('认证失败', '请再次尝试');
				} finally {
					this.setState({
						loading: this.state.loading - 1,
					});
				}
			}
		}
	};

	public render() {
		return (
			<SafeAreaView>
				<ScrollView>
					<Title>身份信息核实</Title>
					<Form>
						<FormLabel>手机号</FormLabel>
						<FormInput onChangeText={this.onPhoneNumberChange} placeholder="请输入您的手机号码" />
						<FormValidationMessage>{this.state.phoneNumberErrorMessage}</FormValidationMessage>
						<FormLabel>身份证号</FormLabel>
						<FormInput onChangeText={this.onIdCardNumberChange} placeholder="请输入您的身份证号码" />
						<FormValidationMessage>{this.state.idCardNumberErrorMessage}</FormValidationMessage>
						<FormLabel>身份证正面照片</FormLabel>
						<ImagePicker
							image={this.state.idCardFrontPicture ? { uri: this.state.idCardFrontPicture } : null}
							onSubmit={this.onIdCardPictureFrontChange}
						/>
						<FormValidationMessage>{this.state.idCardFrontPictureErrorMessage}</FormValidationMessage>
						<FormLabel>身份证背面照片</FormLabel>
						<ImagePicker
							image={this.state.idCardBehindPicture ? { uri: this.state.idCardBehindPicture } : null}
							onSubmit={this.onIdCardPictureBehindChange}
						/>
						<FormValidationMessage>{this.state.idCardBehindPictureErrorMessage}</FormValidationMessage>
					</Form>
					<Button
						style={{ marginLeft: -20, marginRight: -20, marginBottom: 50 }}
						title="提交"
						backgroundColor={color.primary}
						disabled={!this.isValid || this.state.loading > 0}
						loading={this.state.loading > 0}
						onPress={this.onSubmit}
						rounded
					/>
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const ScrollView = styled.ScrollView`padding: 20px;`;
