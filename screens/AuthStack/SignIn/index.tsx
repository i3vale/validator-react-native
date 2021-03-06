/**
 * 用户注册页面
 * @author wsq
 */

import * as React from 'react';
import { StyleSheet, Text, View, AsyncStorage } from 'react-native';
import { Button, FormInput, FormLabel, FormValidationMessage } from 'react-native-elements';
import { color, fontFamily } from '../../../theme';
import { NavigationScreenProps } from 'react-navigation';
import { TOKEN_LABEL } from '../../../utils/config';
import { post } from '../../../utils/fetch';
import { Response, ResponseCode } from '../../../utils/interface';
import Title from '../../../components/Title';
import Container from '../../../components/Container';
import Form from '../../../components/Form/Form';
export interface SignInProps extends NavigationScreenProps {}

export interface SignInState {
	username: string;
	password: string;
	usernameErrorMessage: string;
	passwordErrorMessage: string;
	loading: number;
}

export default class SignIn extends React.Component<SignInProps, SignInState> {
	constructor(params) {
		super(params);
		this.state = {
			username: '',
			password: '',
			usernameErrorMessage: '',
			passwordErrorMessage: '',
			loading: 0,
		};
	}

	onUsernameChange = (text: string) => {
		this.setState({
			username: text,
		});
		this.setState({
			usernameErrorMessage: '',
		});
	};

	onPasswordChange = (text: string) => {
		this.setState({
			password: text,
		});
		this.setState({
			passwordErrorMessage: '',
		});
	};

	/** 验证字段是否都有效 */
	get isValid() {
		return (
			this.state.username &&
			!this.state.usernameErrorMessage &&
			this.state.password &&
			!this.state.passwordErrorMessage
		);
	}
	onSubmit = async () => {
		if (this.isValid) {
			this.setState({
				loading: this.state.loading + 1,
			});
			const { username, password } = this.state;
			const res = await post('/auth', {
				username,
				password,
			});
			const data = (await res.json()) as Response;

			/** 判断请求结果 */
			switch (data.code) {
				/** 用户名不存在 */
				case ResponseCode.USERNAME_NOT_EXIST:
					this.setState({
						usernameErrorMessage: '用户名不存在',
					});
					break;

				/** 密码错误 */
				case ResponseCode.INVALID_PASSWORD:
					this.setState({
						passwordErrorMessage: '密码错误',
					});
					break;

				/** 登录成功 */
				case ResponseCode.SUCCESS:
					/** 将token写入本地存储内 */
					await AsyncStorage.setItem(TOKEN_LABEL, data.data.token);

					/** 跳转至主流程 */
					this.props.navigation.navigate('AuthLoading');

				default:
					break;
			}

			this.setState({
				loading: this.state.loading - 1,
			});
		}
	};
	render() {
		return (
			<Container>
				<Title>登录</Title>
				<Form>
					<FormLabel fontFamily={fontFamily}>用户名</FormLabel>
					<FormInput returnKeyType="next" onChangeText={this.onUsernameChange} placeholder="请输入您的用户名" />
					<FormValidationMessage>{this.state.usernameErrorMessage}</FormValidationMessage>
					<FormLabel>密码</FormLabel>
					<FormInput
						secureTextEntry
						enablesReturnKeyAutomatically
						onChangeText={this.onPasswordChange}
						placeholder="请输入您的密码"
						returnKeyType="done"
					/>
					<FormValidationMessage>{this.state.passwordErrorMessage}</FormValidationMessage>
				</Form>
				<Button
					disabled={!this.isValid || this.state.loading > 0}
					style={styles.button}
					rounded
					backgroundColor={color.primary}
					title="登录"
					onPress={this.onSubmit}
					loading={this.state.loading > 0}
				/>
				<View style={styles.bottomContainer}>
					<Text style={styles.bottomText}>还没有账户? </Text>
					<Text
						onPress={() => {
							this.props.navigation.navigate('SignUp');
						}}
						style={styles.signInLink}
					>
						立即注册
					</Text>
				</View>
			</Container>
		);
	}
}

export const styles = StyleSheet.create({
	button: {
		marginTop: 40,
	},
	bottomContainer: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'center',
	},
	bottomText: {
		color: color.info,
		marginTop: 20,
	},
	signInLink: {
		padding: 20,
		paddingLeft: 10,
		color: color.primary,
		fontWeight: 'bold',
	},
});
