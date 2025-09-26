"use client"

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

export interface RotatingModelProps {
  scale?: number
  onLoaded?: () => void
}

export default function RotatingModel(props: RotatingModelProps) {
  const { scale = 1, onLoaded } = props
  const groupRef = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)
  const speedRef = useRef(0.007)
  const baseScaleRef = useRef<number>(scale)
  const { pointer, camera } = useThree()
  const [collider, setCollider] = useState<{ size: THREE.Vector3; center: THREE.Vector3 } | null>(null)
  const aligningRef = useRef(false)
  const targetYawRef = useRef(0)
  const facingOffsetRef = useRef(Math.PI)

  const normalizeAngle = (a: number) => {
    a = (a + Math.PI) % (Math.PI * 2)
    if (a < 0) a += Math.PI * 2
    return a - Math.PI
  }

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : ''
    return () => { document.body.style.cursor = '' }
  }, [hovered])

  useFrame(() => {
    if (!groupRef.current) return
    let targetSpeed = 0.01
    if (hovered) {
      if (aligningRef.current) {
        const current = groupRef.current.rotation.y
        const delta = normalizeAngle(targetYawRef.current - current)
        const step = delta * 0.25
        if (Math.abs(delta) < 0.01) {
          groupRef.current.rotation.y = targetYawRef.current
          aligningRef.current = false
        } else {
          groupRef.current.rotation.y = current + step
        }
        targetSpeed = 0
      } else {
        targetSpeed = 0
      }
    }
    speedRef.current += (targetSpeed - speedRef.current) * 0.1
    if (!hovered) {
      groupRef.current.rotation.y += speedRef.current
    }

    const canTilt = hovered && !aligningRef.current
    const targetTiltX = canTilt ? pointer.y * 0.2 : 0
    const targetTiltZ = canTilt ? -pointer.x * 0.2 : 0
    groupRef.current.rotation.x += (targetTiltX - groupRef.current.rotation.x) * 0.2
    groupRef.current.rotation.z += (targetTiltZ - groupRef.current.rotation.z) * 0.2

    const targetScale = hovered ? baseScaleRef.current * 1.05 : baseScaleRef.current
    const s = groupRef.current.scale.x
    const newS = s + (targetScale - s) * 0.12
    groupRef.current.scale.set(newS, newS, newS)
  })

  const { scene } = useGLTF('/avatar2export.glb')
  useEffect(() => {
    if (!scene) return
    onLoaded?.()
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    size.multiplyScalar(1.1)
    setCollider({ size, center })
  }, [scene, onLoaded])

  return (
    <group ref={groupRef}>
      {collider && (
        <mesh
          position={[collider.center.x, collider.center.y, collider.center.z]}
          onPointerOver={(e: any) => {
            e.stopPropagation()
            if (groupRef.current) {
              const pos = groupRef.current.getWorldPosition(new THREE.Vector3())
              const dx = camera.position.x - pos.x
              const dz = camera.position.z - pos.z
              const yaw = Math.atan2(dx, dz) + facingOffsetRef.current
              targetYawRef.current = yaw
              aligningRef.current = true
            }
            setHovered(true)
          }}
          onPointerOut={(e: any) => {
            e.stopPropagation()
            setHovered(false)
            aligningRef.current = false
          }}
        >
          <boxGeometry args={[collider.size.x, collider.size.y, collider.size.z]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      )}
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload('/avatar2export.glb')